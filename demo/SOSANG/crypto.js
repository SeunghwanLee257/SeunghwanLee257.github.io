/**
 * AES Encryption Engine for FHE16 Demo
 * Simulates FHE operations using AES-256-GCM
 *
 * In a real FHE system, computations happen on encrypted data.
 * Here we simulate by: encrypt -> decrypt -> compute -> re-encrypt
 */

class CryptoEngine {
    constructor() {
        this.globalKey = null;
        this.keyString = null;
    }

    /**
     * Initialize the global AES-256 key
     */
    async initialize() {
        try {
            this.globalKey = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            const exportedKey = await crypto.subtle.exportKey('raw', this.globalKey);
            this.keyString = this.arrayBufferToHex(exportedKey);

            console.log('[CryptoEngine] Global AES-256 Key initialized');
            return this.keyString.substring(0, 16) + '...';
        } catch (error) {
            console.error('[CryptoEngine] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Convert ArrayBuffer to Hex string
     */
    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert Hex string to ArrayBuffer
     */
    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /**
     * Encrypt data using AES-256-GCM
     * @param {Object} plaintext - Data to encrypt
     * @returns {string} - Hex-encoded ciphertext (IV + ciphertext)
     */
    async encrypt(plaintext) {
        if (!this.globalKey) {
            await this.initialize();
        }

        // Generate random IV (12 bytes for GCM)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Encode plaintext to bytes
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

    /**
     * Decrypt data using AES-256-GCM
     * @param {string} ciphertextHex - Hex-encoded ciphertext
     * @returns {Object} - Decrypted data
     */
    async decrypt(ciphertextHex) {
        if (!this.globalKey) {
            throw new Error('CryptoEngine not initialized');
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

        // Decode to string and parse JSON
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }

    /**
     * Simulate FHE computation
     * In real FHE: computation happens on ciphertext
     * Here: decrypt -> compute -> re-encrypt
     *
     * @param {string[]} encryptedDataArray - Array of encrypted data
     * @param {string} operation - Operation to perform
     * @param {Object} params - Operation parameters
     * @returns {Object} - Encrypted result and plain result (for demo)
     */
    async computeOnEncrypted(encryptedDataArray, operation, params) {
        // Step 1: Decrypt all data
        const decryptedData = [];
        for (const encData of encryptedDataArray) {
            const plain = await this.decrypt(encData);
            decryptedData.push(plain);
        }

        // Step 2: Perform computation
        let result;
        switch (operation) {
            case 'average':
                result = this.computeAverage(decryptedData, params.field);
                break;
            case 'median':
                result = this.computeMedian(decryptedData, params.field);
                break;
            case 'ranking':
                result = this.computeRanking(decryptedData, params.field, params.targetValue);
                break;
            case 'distribution':
                result = this.computeDistribution(decryptedData, params.field);
                break;
            case 'comparison':
                result = this.computeComparison(decryptedData, params.field, params.targetValue);
                break;
            default:
                result = { error: 'Unknown operation' };
        }

        // Step 3: Encrypt result
        const encryptedResult = await this.encrypt(result);

        return {
            encryptedResult,
            plainResult: result, // For demo display only
            participantCount: decryptedData.length
        };
    }

    /**
     * Compute average of a field
     */
    computeAverage(data, field) {
        if (data.length === 0) return { average: 0, count: 0 };

        const values = data.map(d => d[field] || 0);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = Math.round(sum / data.length);

        return {
            average,
            count: data.length,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    /**
     * Compute median of a field
     */
    computeMedian(data, field) {
        if (data.length === 0) return { median: 0, count: 0 };

        const values = data.map(d => d[field] || 0).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        const median = values.length % 2 !== 0
            ? values[mid]
            : Math.round((values[mid - 1] + values[mid]) / 2);

        return {
            median,
            count: data.length,
            q1: values[Math.floor(values.length * 0.25)],
            q3: values[Math.floor(values.length * 0.75)]
        };
    }

    /**
     * Compute ranking position
     */
    computeRanking(data, field, targetValue) {
        if (data.length === 0) return { rank: 0, total: 0, percentile: 0 };

        const values = data.map(d => d[field] || 0).sort((a, b) => b - a);
        const rank = values.findIndex(v => v <= targetValue) + 1;
        const percentile = Math.round((1 - rank / values.length) * 100);

        return {
            rank,
            total: values.length,
            percentile,
            topPercent: Math.round((rank / values.length) * 100)
        };
    }

    /**
     * Compute distribution buckets
     */
    computeDistribution(data, field) {
        if (data.length === 0) return { buckets: [] };

        const values = data.map(d => d[field] || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const bucketSize = range / 5;

        const buckets = [0, 0, 0, 0, 0];
        values.forEach(v => {
            const idx = Math.min(4, Math.floor((v - min) / bucketSize));
            buckets[idx]++;
        });

        return {
            buckets: buckets.map((count, i) => ({
                range: `${Math.round(min + i * bucketSize)}-${Math.round(min + (i + 1) * bucketSize)}`,
                count,
                percentage: Math.round((count / values.length) * 100)
            })),
            total: values.length
        };
    }

    /**
     * Compare target value with average
     */
    computeComparison(data, field, targetValue) {
        const avgResult = this.computeAverage(data, field);
        const diff = targetValue - avgResult.average;
        const diffPercent = avgResult.average > 0
            ? Math.round((diff / avgResult.average) * 100)
            : 0;

        return {
            targetValue,
            average: avgResult.average,
            difference: diff,
            differencePercent: diffPercent,
            status: diff > 0 ? 'above' : diff < 0 ? 'below' : 'equal',
            count: avgResult.count
        };
    }

    /**
     * Generate unique query ID
     */
    generateQueryId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `Q-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Generate hash for audit trail
     */
    async generateHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        return '0x' + this.arrayBufferToHex(hashBuffer).substring(0, 16) + '...';
    }
}

// Export singleton instance
const cryptoEngine = new CryptoEngine();
