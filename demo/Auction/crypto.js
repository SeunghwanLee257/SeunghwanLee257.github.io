/**
 * FHE16 Simulation Crypto Engine for Confidential Auction Demo
 * Uses AES-256-GCM to simulate homomorphic encryption operations
 * Browser holds secret key - decrypts, computes, re-encrypts on each operation
 */

class CryptoEngine {
    constructor() {
        this.secretKey = null;
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.initialized = false;
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
        console.log('[Crypto] Engine initialized with AES-256-GCM');
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
        console.log('[Crypto] New secret key generated');
        return key;
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
     * Simulate FHE computation on encrypted bid data
     * Process: Decrypt → Compute → Re-encrypt
     * @param {Array} encryptedBids - Array of encrypted bid hex strings
     * @param {string} operation - Operation to perform
     * @param {object} params - Additional parameters
     * @returns {object} Result with encrypted output and metadata
     */
    async computeOnEncryptedBids(encryptedBids, operation, params = {}) {
        console.log(`[Crypto] FHE Simulation: ${operation}`);
        console.log('[Crypto] Step 1: Decrypting all bids...');

        // Step 1: Decrypt all bids
        const decryptedBids = [];
        for (const encBid of encryptedBids) {
            const decrypted = await this.decrypt(encBid.encryptedAmount);
            decryptedBids.push({
                ...encBid,
                amount: decrypted.amount,
                bidderId: decrypted.bidderId,
                timestamp: decrypted.timestamp
            });
        }

        console.log(`[Crypto] Decrypted ${decryptedBids.length} bids`);
        console.log('[Crypto] Step 2: Performing computation...');

        // Step 2: Perform computation based on operation
        let result;
        let metadata = {};

        switch (operation) {
            case 'findWinner':
                // Find highest bid (standard English auction)
                const sortedBids = [...decryptedBids].sort((a, b) => b.amount - a.amount);
                const winner = sortedBids[0];
                const secondHighest = sortedBids[1];

                result = {
                    winnerId: winner.bidderId,
                    winningAmount: winner.amount,
                    secondHighestAmount: secondHighest ? secondHighest.amount : null,
                    timestamp: Date.now()
                };

                metadata = {
                    totalBids: decryptedBids.length,
                    priceSpread: winner.amount - (sortedBids[sortedBids.length - 1]?.amount || 0)
                };
                break;

            case 'findWinnerVickrey':
                // Vickrey auction: Winner pays second-highest price
                const vickreySorted = [...decryptedBids].sort((a, b) => b.amount - a.amount);
                const vWinner = vickreySorted[0];
                const vSecond = vickreySorted[1];

                result = {
                    winnerId: vWinner.bidderId,
                    bidAmount: vWinner.amount,
                    payAmount: vSecond ? vSecond.amount : vWinner.amount,
                    timestamp: Date.now()
                };

                metadata = {
                    totalBids: decryptedBids.length,
                    savings: vWinner.amount - (vSecond ? vSecond.amount : vWinner.amount)
                };
                break;

            case 'validateBid':
                // Check if new bid is higher than current highest
                const currentHighest = Math.max(...decryptedBids.map(b => b.amount));
                const newBidAmount = params.newBidAmount;

                result = {
                    isValid: newBidAmount > currentHighest,
                    currentHighest: currentHighest,
                    newBid: newBidAmount,
                    difference: newBidAmount - currentHighest
                };
                break;

            case 'getBidRanking':
                // Get anonymous ranking of all bids
                const rankings = [...decryptedBids]
                    .sort((a, b) => b.amount - a.amount)
                    .map((bid, index) => ({
                        rank: index + 1,
                        bidderId: bid.bidderId,
                        isCurrentUser: bid.bidderId === params.currentUserId
                    }));

                result = {
                    rankings: rankings,
                    totalBidders: decryptedBids.length,
                    timestamp: Date.now()
                };
                break;

            case 'getStatistics':
                // Calculate bid statistics (aggregate only, no individual amounts)
                const amounts = decryptedBids.map(b => b.amount);
                const sum = amounts.reduce((a, b) => a + b, 0);

                result = {
                    bidCount: amounts.length,
                    averageBid: Math.round(sum / amounts.length),
                    highestBid: Math.max(...amounts),
                    lowestBid: Math.min(...amounts),
                    totalValue: sum
                };
                break;

            case 'checkReserve':
                // Check if any bid meets reserve price
                const reservePrice = params.reservePrice || 0;
                const meetsReserve = decryptedBids.some(b => b.amount >= reservePrice);
                const highestOfAll = Math.max(...decryptedBids.map(b => b.amount));

                result = {
                    meetsReserve: meetsReserve,
                    highestBid: highestOfAll,
                    reservePrice: reservePrice,
                    gap: reservePrice - highestOfAll
                };
                break;

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

        console.log('[Crypto] Step 3: Re-encrypting result...');

        // Step 3: Encrypt the result
        const encryptedResult = await this.encrypt(result);

        console.log('[Crypto] FHE computation complete');

        return {
            encryptedResult: encryptedResult,
            operation: operation,
            metadata: metadata,
            timestamp: Date.now()
        };
    }

    /**
     * Create an encrypted bid
     * @param {number} amount - Bid amount
     * @param {string} bidderId - Bidder identifier
     * @returns {object} Encrypted bid object
     */
    async createEncryptedBid(amount, bidderId) {
        const bidData = {
            amount: amount,
            bidderId: bidderId,
            timestamp: Date.now(),
            nonce: crypto.getRandomValues(new Uint8Array(8)).join('')
        };

        const encryptedAmount = await this.encrypt(bidData);

        return {
            encryptedAmount: encryptedAmount,
            bidderId: bidderId, // Public identifier
            timestamp: Date.now(),
            publicCommitment: await this.createCommitment(amount)
        };
    }

    /**
     * Create a commitment hash for a bid amount (for verification)
     */
    async createCommitment(amount) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const data = new TextEncoder().encode(`${amount}:${Array.from(salt).join('')}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 16);
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
            keyLoaded: !!this.secretKey
        };
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
