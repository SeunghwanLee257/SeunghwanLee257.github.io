import { createAuctionDiagnosticClient } from './sdk/auction.js';

// The host supplies one asset root. The SDK owns loading, keys, workers,
// exact-won comparisons, tie order, result reuse and failure handling.
const client = createAuctionDiagnosticClient({ assetRoot: new URL('./', import.meta.url), purpose: 'diagnostic' });

export const cryptoEngine = {
    lastCompute: null,
    createBid: (amount, bidderId) => client.createBid(amount, bidderId),
    preview: amount => client.preview(amount),
    async computeWinner(bids) {
        const result = await client.resolve(bids.map(bid => bid.id));
        this.lastCompute = { comparisons: result.comparisons, ms: result.elapsedMs, assurance: result.assurance };
        return result;
    },
    formatForDisplay(value, maxLength = 32) {
        return !value || value.length <= maxLength ? value : value.slice(0, maxLength / 2) + '...' + value.slice(-maxLength / 2);
    },
    dispose: () => client.dispose(),
};

window.addEventListener('pagehide', event => { if (!event.persisted) cryptoEngine.dispose(); });
