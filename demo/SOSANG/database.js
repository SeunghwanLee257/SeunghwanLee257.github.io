/**
 * IndexedDB Database Manager for 딸깍배당 Demo
 * Stores encrypted store data and dividend records
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'DdalggakBaedangDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('[DB] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[DB] Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('[DB] Upgrading database...');

                // Stores table - encrypted store data
                if (!db.objectStoreNames.contains('stores')) {
                    const storesStore = db.createObjectStore('stores', { keyPath: 'id', autoIncrement: true });
                    storesStore.createIndex('location', 'location', { unique: false });
                    storesStore.createIndex('category', 'category', { unique: false });
                    storesStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Queries table - query history
                if (!db.objectStoreNames.contains('queries')) {
                    const queriesStore = db.createObjectStore('queries', { keyPath: 'id' });
                    queriesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    queriesStore.createIndex('type', 'type', { unique: false });
                }

                // Dividends table - dividend records
                if (!db.objectStoreNames.contains('dividends')) {
                    const dividendsStore = db.createObjectStore('dividends', { keyPath: 'id', autoIncrement: true });
                    dividendsStore.createIndex('storeId', 'storeId', { unique: false });
                    dividendsStore.createIndex('queryId', 'queryId', { unique: false });
                    dividendsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Feed table - local KPI feed
                if (!db.objectStoreNames.contains('feed')) {
                    const feedStore = db.createObjectStore('feed', { keyPath: 'id', autoIncrement: true });
                    feedStore.createIndex('location', 'location', { unique: false });
                    feedStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('[DB] Database schema created');
            };
        });
    }

    /**
     * Add a store
     */
    async addStore(storeData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readwrite');
            const store = transaction.objectStore('stores');

            const data = {
                ...storeData,
                createdAt: Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => {
                console.log('[DB] Store added with ID:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[DB] Failed to add store:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all stores
     */
    async getAllStores() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readonly');
            const store = transaction.objectStore('stores');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get stores by location
     */
    async getStoresByLocation(location) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readonly');
            const store = transaction.objectStore('stores');
            const index = store.index('location');
            const request = index.getAll(location);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get stores by category
     */
    async getStoresByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readonly');
            const store = transaction.objectStore('stores');
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get a single store by ID
     */
    async getStore(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readonly');
            const store = transaction.objectStore('stores');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Update a store
     */
    async updateStore(storeData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readwrite');
            const store = transaction.objectStore('stores');
            const request = store.put(storeData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Delete a store
     */
    async deleteStore(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['stores'], 'readwrite');
            const store = transaction.objectStore('stores');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Add a query record
     */
    async addQuery(queryData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['queries'], 'readwrite');
            const store = transaction.objectStore('queries');

            const data = {
                ...queryData,
                timestamp: Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all queries
     */
    async getAllQueries() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['queries'], 'readonly');
            const store = transaction.objectStore('queries');
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by timestamp descending
                const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Add a dividend record
     */
    async addDividend(dividendData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dividends'], 'readwrite');
            const store = transaction.objectStore('dividends');

            const data = {
                ...dividendData,
                timestamp: Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get dividends by store ID
     */
    async getDividendsByStore(storeId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dividends'], 'readonly');
            const store = transaction.objectStore('dividends');
            const index = store.index('storeId');
            const request = index.getAll(storeId);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all dividends
     */
    async getAllDividends() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dividends'], 'readonly');
            const store = transaction.objectStore('dividends');
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Add a feed item
     */
    async addFeedItem(feedData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['feed'], 'readwrite');
            const store = transaction.objectStore('feed');

            const data = {
                ...feedData,
                timestamp: Date.now()
            };

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get feed items by location
     */
    async getFeedByLocation(location) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['feed'], 'readonly');
            const store = transaction.objectStore('feed');
            const index = store.index('location');
            const request = index.getAll(location);

            request.onsuccess = () => {
                const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get all feed items
     */
    async getAllFeed() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['feed'], 'readonly');
            const store = transaction.objectStore('feed');
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(results.slice(0, 20)); // Limit to 20 items
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get total dividend amount
     */
    async getTotalDividends() {
        const dividends = await this.getAllDividends();
        return dividends.reduce((sum, d) => sum + (d.amount || 0), 0);
    }

    /**
     * Clear all data (for demo reset)
     */
    async clearAll() {
        const stores = ['stores', 'queries', 'dividends', 'feed'];

        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        console.log('[DB] All data cleared');
    }
}

// Export singleton instance
const db = new DatabaseManager();
