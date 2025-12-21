/**
 * AES Encryption Simulation for FHE Demo
 * Uses Web Crypto API for AES-256-GCM encryption
 */

class CryptoEngine {
    constructor() {
        this.globalKey = null;
        this.keyString = null;
        this.iv = null;
    }

    // Initialize with a global AES key
    async initialize() {
        // Generate a random AES-256 key
        this.globalKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        // Export key for display
        const exportedKey = await crypto.subtle.exportKey('raw', this.globalKey);
        this.keyString = this.arrayBufferToHex(exportedKey);

        console.log('Global AES Key initialized:', this.keyString.substring(0, 16) + '...');
        return this.keyString;
    }

    // Convert ArrayBuffer to Hex string
    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Convert Hex string to ArrayBuffer
    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    // Encrypt data using AES-256-GCM
    async encrypt(plaintext) {
        if (!this.globalKey) {
            await this.initialize();
        }

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encode plaintext
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(plaintext));

        // Encrypt
        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            this.globalKey,
            data
        );

        // Combine IV + ciphertext
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return this.arrayBufferToHex(combined.buffer);
    }

    // Decrypt data using AES-256-GCM
    async decrypt(ciphertextHex) {
        if (!this.globalKey) {
            throw new Error('Crypto engine not initialized');
        }

        const combined = new Uint8Array(this.hexToArrayBuffer(ciphertextHex));

        // Extract IV and ciphertext
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            this.globalKey,
            ciphertext
        );

        // Decode
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    // Simulate FHE computation (decrypt -> compute -> encrypt)
    async computeOnEncrypted(encryptedData, operation, params) {
        // Decrypt
        const plainData = await this.decrypt(encryptedData);

        // Perform operation
        let result;
        switch (operation) {
            case 'checkLimit':
                result = this.checkInvestmentLimit(plainData, params);
                break;
            case 'checkKYC':
                result = this.checkKYCStatus(plainData, params);
                break;
            case 'checkEligibility':
                result = this.checkEligibility(plainData, params);
                break;
            default:
                result = plainData;
        }

        // Encrypt result
        const encryptedResult = await this.encrypt(result);
        return {
            encryptedResult,
            plainResult: result // For demo display only
        };
    }

    // Check investment limit
    checkInvestmentLimit(data, params) {
        const { investmentLimit, currentHolding = 0 } = data;
        const { requestedAmount } = params;

        const remainingLimit = investmentLimit - currentHolding;
        const allowed = requestedAmount <= remainingLimit;

        return {
            allowed,
            reason: allowed
                ? 'Within investment limit'
                : `Exceeds limit by ${(requestedAmount - remainingLimit).toLocaleString()} KRW`,
            remainingLimit
        };
    }

    // Check KYC status
    checkKYCStatus(data, params) {
        const { kycStatus, kycExpiry } = data;
        const now = new Date();
        const expiry = new Date(kycExpiry);

        const isValid = kycStatus === 'VERIFIED' && expiry > now;

        return {
            allowed: isValid,
            reason: isValid
                ? 'KYC verified and valid'
                : kycStatus !== 'VERIFIED'
                    ? 'KYC not verified'
                    : 'KYC expired'
        };
    }

    // Check overall eligibility
    checkEligibility(data, params) {
        const { accreditedInvestor, annualIncome, totalAssets } = data;
        const { tokenType, requestedAmount } = params;

        // Simple eligibility rules
        let allowed = true;
        let reasons = [];

        // Rule 1: Accredited investor check for high-value tokens
        if (tokenType === 'REALESTATE-A' && !accreditedInvestor) {
            if (annualIncome < 100000000 && totalAssets < 500000000) {
                allowed = false;
                reasons.push('Not qualified for real estate token (requires accredited investor status)');
            }
        }

        // Rule 2: Minimum income check
        if (annualIncome < 30000000 && requestedAmount > 10000000) {
            allowed = false;
            reasons.push('Income below threshold for requested amount');
        }

        return {
            allowed,
            reason: allowed ? 'All eligibility checks passed' : reasons.join('; ')
        };
    }

    // Generate hash for evidence trail
    async generateHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        return '0x' + this.arrayBufferToHex(hashBuffer).substring(0, 16) + '...';
    }

    // Generate signature (simulated)
    async generateSignature(data) {
        const hash = await this.generateHash(data);
        const timestamp = Date.now();
        return `sig:${hash.substring(2, 10)}${timestamp.toString(16).substring(0, 8)}`;
    }
}

// Export singleton instance
const cryptoEngine = new CryptoEngine();
