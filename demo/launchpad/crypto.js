/**
 * FHE16 Simulation Crypto Engine for Token Launchpad Demo
 * Uses AES-256-GCM to simulate homomorphic encryption operations
 * Browser holds global secret key - decrypts, computes, re-encrypts on each operation
 */

class CryptoEngine {
    constructor() {
        this.secretKey = null;
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.initialized = false;
        this.operationLog = [];
    }

    /**
     * Initialize the crypto engine with a new or existing key
     */
    async initialize(existingKey = null) {
        if (existingKey) {
            this.secretKey = existingKey;
        } else {
            this.secretKey = await this.generateKey();
        }
        this.initialized = true;
        this.log('Engine initialized with AES-256-GCM (FHE16 Simulation)');
        return this.secretKey;
    }

    /**
     * Generate a new AES-256 key
     */
    async generateKey() {
        const key = await crypto.subtle.generateKey(
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
        this.log('New global secret key generated');
        return key;
    }

    /**
     * Log operation for visualization
     */
    log(message, type = 'info') {
        const entry = {
            timestamp: Date.now(),
            message: message,
            type: type
        };
        this.operationLog.push(entry);
        console.log(`[FHE16] ${message}`);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('fhe-log', { detail: entry }));
    }

    /**
     * Encrypt plaintext data
     * @param {any} plaintext - Data to encrypt (will be JSON stringified)
     * @returns {string} Hex-encoded ciphertext with IV prefix
     */
    async encrypt(plaintext) {
        if (!this.initialized) {
            throw new Error('Crypto engine not initialized');
        }

        const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
        const data = typeof plaintext === 'string'
            ? plaintext
            : JSON.stringify(plaintext);

        const encodedData = new TextEncoder().encode(data);

        const ciphertext = await crypto.subtle.encrypt(
            { name: this.algorithm, iv: iv },
            this.secretKey,
            encodedData
        );

        // Combine IV + ciphertext and convert to hex
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        const hexString = Array.from(combined)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return hexString;
    }

    /**
     * Decrypt ciphertext
     * @param {string} ciphertextHex - Hex-encoded ciphertext with IV prefix
     * @returns {any} Decrypted and parsed data
     */
    async decrypt(ciphertextHex) {
        if (!this.initialized) {
            throw new Error('Crypto engine not initialized');
        }

        // Convert hex to Uint8Array
        const combined = new Uint8Array(
            ciphertextHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );

        const iv = combined.slice(0, this.ivLength);
        const ciphertext = combined.slice(this.ivLength);

        const decrypted = await crypto.subtle.decrypt(
            { name: this.algorithm, iv: iv },
            this.secretKey,
            ciphertext
        );

        const decodedData = new TextDecoder().decode(decrypted);

        // Try to parse as JSON, return as string if fails
        try {
            return JSON.parse(decodedData);
        } catch {
            return decodedData;
        }
    }

    /**
     * Create an encrypted bid for token presale
     * @param {number} pricePerToken - Bid price per token (in USDT)
     * @param {number} quantity - Number of tokens to purchase
     * @param {string} bidderId - Bidder identifier
     * @returns {object} Encrypted bid object
     */
    async createEncryptedBid(pricePerToken, quantity, bidderId) {
        const bidData = {
            pricePerToken: pricePerToken,
            quantity: quantity,
            totalAmount: pricePerToken * quantity,
            bidderId: bidderId,
            timestamp: Date.now(),
            nonce: crypto.getRandomValues(new Uint8Array(8)).join('')
        };

        const encryptedBid = await this.encrypt(bidData);

        this.log(`Bid encrypted: ${bidderId} - ${this.formatForDisplay(encryptedBid, 24)}`);

        return {
            encryptedData: encryptedBid,
            bidderId: bidderId,
            timestamp: Date.now(),
            commitment: await this.createCommitment(pricePerToken, quantity)
        };
    }

    /**
     * Create a commitment hash for bid verification
     */
    async createCommitment(price, quantity) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const data = new TextEncoder().encode(`${price}:${quantity}:${Array.from(salt).join('')}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 16);
    }

    /**
     * FHE16 Simulation: Compute on encrypted bids
     * Process: Decrypt -> Compute -> Re-encrypt
     * @param {Array} encryptedBids - Array of encrypted bid objects
     * @param {string} operation - Operation to perform
     * @param {object} params - Additional parameters
     * @returns {object} Result with encrypted output and metadata
     */
    async computeOnEncryptedBids(encryptedBids, operation, params = {}) {
        this.log(`FHE16 Operation: ${operation}`, 'operation');
        this.log('Step 1: Decrypting all bids...', 'decrypt');

        // Step 1: Decrypt all bids
        const decryptedBids = [];
        for (const encBid of encryptedBids) {
            const decrypted = await this.decrypt(encBid.encryptedData);
            decryptedBids.push({
                ...encBid,
                pricePerToken: decrypted.pricePerToken,
                quantity: decrypted.quantity,
                totalAmount: decrypted.totalAmount,
                bidderId: decrypted.bidderId,
                originalTimestamp: decrypted.timestamp
            });
        }

        this.log(`Decrypted ${decryptedBids.length} bids`, 'decrypt');
        this.log('Step 2: Performing computation...', 'compute');

        // Step 2: Perform computation based on operation
        let result;
        let metadata = {};

        switch (operation) {
            case 'calculateClearingPrice':
                // CCA: Calculate market clearing price
                result = this.calculateClearingPrice(decryptedBids, params);
                metadata = {
                    totalBids: decryptedBids.length,
                    algorithm: 'CCA-BlindAuction'
                };
                break;

            case 'getRoundStatistics':
                // Get aggregate statistics for a round (no individual amounts revealed)
                result = this.calculateRoundStatistics(decryptedBids, params);
                metadata = {
                    totalBids: decryptedBids.length,
                    roundNumber: params.roundNumber
                };
                break;

            case 'determineWinners':
                // Determine winning bids after auction ends
                result = this.determineWinners(decryptedBids, params);
                metadata = {
                    totalBids: decryptedBids.length,
                    totalWinners: result.winners.length
                };
                break;

            case 'getSupplyDemandCurve':
                // Calculate supply-demand curve for price discovery
                result = this.calculateSupplyDemandCurve(decryptedBids, params);
                metadata = {
                    totalBids: decryptedBids.length,
                    pricePoints: result.demandCurve.length
                };
                break;

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        this.log('Step 3: Re-encrypting result...', 'encrypt');

        // Step 3: Encrypt the result
        const encryptedResult = await this.encrypt(result);

        this.log('FHE16 computation complete', 'complete');

        return {
            encryptedResult: encryptedResult,
            operation: operation,
            metadata: metadata,
            timestamp: Date.now()
        };
    }

    /**
     * Calculate market clearing price using CCA mechanism
     */
    calculateClearingPrice(bids, params) {
        const { totalSupply, minPrice = 0 } = params;

        // Sort bids by price descending
        const sortedBids = [...bids].sort((a, b) => b.pricePerToken - a.pricePerToken);

        let accumulatedQuantity = 0;
        let clearingPrice = minPrice;

        for (const bid of sortedBids) {
            accumulatedQuantity += bid.quantity;

            if (accumulatedQuantity >= totalSupply) {
                clearingPrice = bid.pricePerToken;
                break;
            }
            clearingPrice = bid.pricePerToken;
        }

        // Calculate total demand at clearing price
        const demandAtClearingPrice = bids
            .filter(b => b.pricePerToken >= clearingPrice)
            .reduce((sum, b) => sum + b.quantity, 0);

        // Calculate oversubscription ratio
        const oversubscriptionRatio = demandAtClearingPrice / totalSupply;

        return {
            clearingPrice: clearingPrice,
            totalDemand: demandAtClearingPrice,
            totalSupply: totalSupply,
            oversubscriptionRatio: oversubscriptionRatio,
            isOversubscribed: demandAtClearingPrice > totalSupply,
            timestamp: Date.now()
        };
    }

    /**
     * Calculate round statistics (aggregate only)
     */
    calculateRoundStatistics(bids, params) {
        if (bids.length === 0) {
            return {
                bidCount: 0,
                averagePrice: 0,
                priceRange: { min: 0, max: 0 },
                totalDemand: 0,
                totalValue: 0
            };
        }

        const prices = bids.map(b => b.pricePerToken);
        const quantities = bids.map(b => b.quantity);
        const values = bids.map(b => b.totalAmount);

        return {
            bidCount: bids.length,
            averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
            priceRange: {
                min: Math.min(...prices),
                max: Math.max(...prices)
            },
            totalDemand: quantities.reduce((a, b) => a + b, 0),
            totalValue: values.reduce((a, b) => a + b, 0),
            timestamp: Date.now()
        };
    }

    /**
     * Determine winners after auction ends
     */
    determineWinners(bids, params) {
        const { totalSupply, clearingPrice } = params;

        // Filter bids at or above clearing price
        const eligibleBids = bids
            .filter(b => b.pricePerToken >= clearingPrice)
            .sort((a, b) => {
                // Sort by price (desc), then by timestamp (asc) for tie-breaking
                if (b.pricePerToken !== a.pricePerToken) {
                    return b.pricePerToken - a.pricePerToken;
                }
                return a.originalTimestamp - b.originalTimestamp;
            });

        let remainingSupply = totalSupply;
        const winners = [];
        const losers = [];

        for (const bid of eligibleBids) {
            if (remainingSupply <= 0) {
                losers.push({
                    bidderId: bid.bidderId,
                    requestedQuantity: bid.quantity,
                    allocatedQuantity: 0,
                    pricePerToken: clearingPrice,
                    totalCost: 0,
                    status: 'not_filled'
                });
                continue;
            }

            const allocatedQuantity = Math.min(bid.quantity, remainingSupply);
            remainingSupply -= allocatedQuantity;

            winners.push({
                bidderId: bid.bidderId,
                requestedQuantity: bid.quantity,
                allocatedQuantity: allocatedQuantity,
                pricePerToken: clearingPrice,
                totalCost: allocatedQuantity * clearingPrice,
                status: allocatedQuantity === bid.quantity ? 'fully_filled' : 'partially_filled'
            });
        }

        // Add bids below clearing price as losers
        const belowClearingBids = bids.filter(b => b.pricePerToken < clearingPrice);
        for (const bid of belowClearingBids) {
            losers.push({
                bidderId: bid.bidderId,
                requestedQuantity: bid.quantity,
                allocatedQuantity: 0,
                pricePerToken: clearingPrice,
                totalCost: 0,
                status: 'below_clearing_price'
            });
        }

        return {
            winners: winners,
            losers: losers,
            clearingPrice: clearingPrice,
            totalAllocated: totalSupply - remainingSupply,
            totalRaised: winners.reduce((sum, w) => sum + w.totalCost, 0),
            timestamp: Date.now()
        };
    }

    /**
     * Calculate supply-demand curve for visualization
     */
    calculateSupplyDemandCurve(bids, params) {
        const { totalSupply, minPrice = 0, maxPrice = 100 } = params;

        // Get unique prices and sort descending
        const uniquePrices = [...new Set(bids.map(b => b.pricePerToken))].sort((a, b) => b - a);

        // Add boundary prices if needed
        if (!uniquePrices.includes(maxPrice)) uniquePrices.unshift(maxPrice);
        if (!uniquePrices.includes(minPrice)) uniquePrices.push(minPrice);

        // Calculate cumulative demand at each price point
        const demandCurve = uniquePrices.map(price => {
            const demandAtPrice = bids
                .filter(b => b.pricePerToken >= price)
                .reduce((sum, b) => sum + b.quantity, 0);

            return {
                price: price,
                cumulativeDemand: demandAtPrice
            };
        });

        // Supply is constant
        const supplyCurve = uniquePrices.map(price => ({
            price: price,
            supply: totalSupply
        }));

        return {
            demandCurve: demandCurve,
            supplyCurve: supplyCurve,
            totalSupply: totalSupply,
            timestamp: Date.now()
        };
    }

    /**
     * Format encrypted data for display (truncated)
     */
    formatForDisplay(encryptedHex, maxLength = 32) {
        if (encryptedHex.length <= maxLength) {
            return encryptedHex;
        }
        return `${encryptedHex.substring(0, maxLength / 2)}...${encryptedHex.substring(encryptedHex.length - maxLength / 2)}`;
    }

    /**
     * Get encryption status info
     */
    getStatus() {
        return {
            initialized: this.initialized,
            algorithm: `${this.algorithm}-${this.keyLength}`,
            keyLoaded: !!this.secretKey,
            operationCount: this.operationLog.length
        };
    }

    /**
     * Get recent operation logs
     */
    getRecentLogs(count = 10) {
        return this.operationLog.slice(-count);
    }

    /**
     * Clear operation logs
     */
    clearLogs() {
        this.operationLog = [];
    }

    /**
     * Export key for storage (demo only - not for production)
     */
    async exportKey() {
        if (!this.secretKey) return null;
        const exported = await crypto.subtle.exportKey('raw', this.secretKey);
        return Array.from(new Uint8Array(exported))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Import key from storage (demo only - not for production)
     */
    async importKey(hexKey) {
        const keyData = new Uint8Array(
            hexKey.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );
        this.secretKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: this.algorithm, length: this.keyLength },
            true,
            ['encrypt', 'decrypt']
        );
        this.initialized = true;
        return this.secretKey;
    }
}

// Export singleton instance
const cryptoEngine = new CryptoEngine();
