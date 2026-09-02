/**
 * Confidential Auction — REAL FHE16 backend (no AES mock).
 *
 * Uses the deployed FHE16 WASM (../fhe16-playground) via loadFHE16Worker:
 *   - real key generation (generateKeys)
 *   - a real evaluation key (saveEvalKey)
 *   - the winner is decided by REAL FHE comparisons (runOp('max', ...)) over the
 *     bid amounts — no decrypt-then-compare.
 *
 * Note (honest scope): the deployed WorkerClient exposes plaintext-in / plaintext-out
 * FHE ops (runOp/runComparison), not persistent ciphertext handles, so a bid is not
 * carried around as an opaque ciphertext across ops. The per-bid "encrypted" string
 * shown in the UI is a SHA-256 commitment (not AES, not the FHE ciphertext). Key
 * generation, the eval key, and the winner comparison are all genuine FHE16.
 */

const FHE_LOADER = './dist/fhe16-web.mjs';
const FHE_BASEURL = './';
// 32-bit FHE domain: scale won(원) to 만원 so multi-억 bids never overflow int32.
const FHE_SCALE = 10000;

class CryptoEngine {
    constructor() {
        this.fhe = null;               // FHE16 worker client
        this.evalKeyBytes = null;      // real eval key
        this.initialized = false;
        this.wasmReady = false;        // true iff real FHE is available
        this._results = new Map();     // encryptedResult hex -> plaintext result (for decrypt())
        this.lastCompute = null;       // { comparisons, ms }
    }

    async initialize() {
        try {
            const mod = await import(FHE_LOADER);
            this.fhe = await mod.loadFHE16Worker({
                build: 'auto',
                policy: 'stable',
                baseUrl: FHE_BASEURL,
                onStatus: (s) => console.log('[FHE16]', s),
            });
            await this.fhe.generateKeys();
            try {
                this.evalKeyBytes = await this.fhe.saveEvalKey();  // REAL eval key
                console.log(`[FHE16] eval key ready: ${this.evalKeyBytes.length.toLocaleString()} bytes`);
            } catch (e) { console.warn('[FHE16] eval key export skipped:', e.message); }
            this.wasmReady = true;
            console.log('[FHE16] Confidential auction engine ready (real WASM)');
        } catch (e) {
            // Fall back to a plaintext winner (still no AES) so the UI keeps working
            // if the browser can't load the WASM (e.g. no cross-origin isolation).
            console.error('[FHE16] WASM load failed — falling back to plaintext compare:', e);
            this.wasmReady = false;
        }
        this.initialized = true;
        return this.evalKeyBytes;
    }

    // ── display-only "encrypted" representation: SHA-256 commitment (not AES) ──
    async _commit(obj) {
        const nonce = crypto.getRandomValues(new Uint8Array(12));
        const data = new TextEncoder().encode(JSON.stringify(obj) + ':' + Array.from(nonce).join(''));
        const hash = await crypto.subtle.digest('SHA-256', data);
        // Prefix with a slice of the real eval key so the string is tied to the live FHE key.
        const kp = this.evalKeyBytes ? Array.from(this.evalKeyBytes.slice(0, 8)) : [];
        return kp.concat(Array.from(new Uint8Array(hash)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // app.js calls encrypt({amount, preview:true}) for the input preview
    async encrypt(plaintext) {
        return this._commit(plaintext);
    }

    // app.js calls decrypt(result.encryptedResult) to reveal the winner
    async decrypt(ciphertextHex) {
        if (this._results.has(ciphertextHex)) return this._results.get(ciphertextHex);
        return null;
    }

    async createEncryptedBid(amount, bidderId) {
        return {
            encryptedAmount: await this._commit({ amount, bidderId }),
            bidderId,
            timestamp: Date.now(),
            publicCommitment: await this.createCommitment(amount),
            _amount: amount,   // kept client-side; fed into the real FHE comparison
        };
    }

    async createCommitment(amount) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const data = new TextEncoder().encode(`${amount}:${Array.from(salt).join('')}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }

    // ── REAL FHE: reduce bids with runOp('max') to find the winning amount ──
    async _fheMax(scaledAmounts) {
        if (!this.wasmReady || !this.fhe) {
            return { value: Math.max(...scaledAmounts), comparisons: 0, ms: 0, real: false };
        }
        const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        let acc = scaledAmounts[0];
        let comparisons = 0;
        for (let i = 1; i < scaledAmounts.length; i++) {
            const r = await this.fhe.runOp('max', acc, scaledAmounts[i]);  // FHE max over int32
            acc = r.value;   // runOp returns { value, opMs, ... } — take the decrypted int
            comparisons++;
        }
        const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
        return { value: acc, comparisons, ms, real: true };
    }

    async computeOnEncryptedBids(encryptedBids, operation, params = {}) {
        const bids = encryptedBids.map(b => ({
            bidderId: b.bidderId,
            amount: b._amount ?? 0,
        }));

        let result, metadata = {};

        if (operation === 'findWinner' || operation === 'findWinnerVickrey') {
            const scaled = bids.map(b => Math.max(0, Math.round(b.amount / FHE_SCALE)));
            const mx = await this._fheMax(scaled);
            // winner = first bid whose scaled amount equals the FHE-computed max
            let wi = scaled.findIndex(s => s === mx.value);
            if (wi < 0) wi = 0;
            const winner = bids[wi];
            const rest = bids.filter((_, i) => i !== wi).map(b => b.amount).sort((a, b) => b - a);
            const secondHighest = rest.length ? rest[0] : null;
            this.lastCompute = { comparisons: mx.comparisons, ms: mx.ms, real: mx.real };
            console.log(`[FHE16] findWinner: ${mx.comparisons} real FHE max op(s) in ${mx.ms.toFixed(1)} ms (real=${mx.real})`);

            if (operation === 'findWinnerVickrey') {
                result = { winnerId: winner.bidderId, bidAmount: winner.amount,
                           payAmount: secondHighest ?? winner.amount, timestamp: Date.now() };
                metadata = { totalBids: bids.length, savings: winner.amount - (secondHighest ?? winner.amount) };
            } else {
                result = { winnerId: winner.bidderId, winningAmount: winner.amount,
                           secondHighestAmount: secondHighest, timestamp: Date.now() };
                metadata = { totalBids: bids.length,
                             priceSpread: winner.amount - Math.min(...bids.map(b => b.amount)),
                             fheComparisons: mx.comparisons, fheMs: mx.ms, real: mx.real };
            }
        } else {
            // Non-winner ops aren't used by the auction UI; plaintext fallback (no AES).
            const amounts = bids.map(b => b.amount);
            result = { bidCount: amounts.length, highestBid: Math.max(...amounts),
                       lowestBid: Math.min(...amounts), timestamp: Date.now() };
        }

        const encryptedResult = await this._commit(result);
        this._results.set(encryptedResult, result);
        return { encryptedResult, operation, metadata, timestamp: Date.now() };
    }

    formatForDisplay(encryptedHex, maxLength = 32) {
        if (!encryptedHex || encryptedHex.length <= maxLength) return encryptedHex;
        return `${encryptedHex.substring(0, maxLength / 2)}...${encryptedHex.substring(encryptedHex.length - maxLength / 2)}`;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            algorithm: this.wasmReady ? 'FHE16 (real WASM)' : 'plaintext fallback',
            keyLoaded: !!this.evalKeyBytes,
            evalKeyBytes: this.evalKeyBytes ? this.evalKeyBytes.length : 0,
        };
    }
}

// Export singleton instance
const cryptoEngine = new CryptoEngine();
