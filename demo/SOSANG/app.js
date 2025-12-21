/**
 * 딸깍배당 FHE16 Demo Application
 * Main application logic
 */

class DdalggakApp {
    constructor() {
        this.selectedQueryType = 'neighborhood';
        this.selectedStoreId = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('[App] Initializing...');

            // Initialize database
            await db.initialize();

            // Initialize crypto engine
            const keyPreview = await cryptoEngine.initialize();
            document.getElementById('globalKeyDisplay').textContent = keyPreview;

            // Load sample data if empty
            const stores = await db.getAllStores();
            if (stores.length === 0) {
                await this.loadSampleData();
            }

            // Render UI
            await this.renderStores();
            await this.renderDividendHistory();
            await this.renderLocalFeed();
            await this.updateWalletStats();

            this.isInitialized = true;
            console.log('[App] Initialization complete');
        } catch (error) {
            console.error('[App] Initialization failed:', error);
        }
    }

    /**
     * Load sample encrypted store data
     */
    async loadSampleData() {
        const sampleStores = [
            {
                name: '흑석동 로스터리',
                category: 'cafe',
                location: '흑석동',
                sales: 3200,
                costRate: 32,
                laborCost: 480,
                rent: 180,
                profit: 800
            },
            {
                name: '신림 치킨집',
                category: 'chicken',
                location: '신림동',
                sales: 4500,
                costRate: 38,
                laborCost: 600,
                rent: 220,
                profit: 950
            },
            {
                name: '강남역 편의점',
                category: 'convenience',
                location: '강남역',
                sales: 6800,
                costRate: 75,
                laborCost: 350,
                rent: 450,
                profit: 380
            },
            {
                name: '흑석동 분식',
                category: 'restaurant',
                location: '흑석동',
                sales: 2800,
                costRate: 35,
                laborCost: 420,
                rent: 150,
                profit: 650
            },
            {
                name: '신림동 카페',
                category: 'cafe',
                location: '신림동',
                sales: 2500,
                costRate: 30,
                laborCost: 380,
                rent: 200,
                profit: 580
            },
            {
                name: '강남역 베이커리',
                category: 'bakery',
                location: '강남역',
                sales: 5200,
                costRate: 40,
                laborCost: 520,
                rent: 380,
                profit: 720
            },
            {
                name: '흑석동 치킨',
                category: 'chicken',
                location: '흑석동',
                sales: 3800,
                costRate: 36,
                laborCost: 450,
                rent: 170,
                profit: 820
            },
            {
                name: '신림 편의점',
                category: 'convenience',
                location: '신림동',
                sales: 4200,
                costRate: 72,
                laborCost: 280,
                rent: 180,
                profit: 310
            }
        ];

        for (const store of sampleStores) {
            // Encrypt sensitive data
            const sensitiveData = {
                sales: store.sales,
                costRate: store.costRate,
                laborCost: store.laborCost,
                rent: store.rent,
                profit: store.profit
            };

            const encryptedData = await cryptoEngine.encrypt(sensitiveData);

            await db.addStore({
                name: store.name,
                category: store.category,
                location: store.location,
                encryptedData: encryptedData,
                // For demo display only (not used in real queries)
                displayData: sensitiveData
            });
        }

        // Add sample feed items
        await this.generateSampleFeed();

        console.log('[App] Sample data loaded');
    }

    /**
     * Generate sample feed items
     */
    async generateSampleFeed() {
        const feedItems = [
            { location: '흑석동', tag: '#흑석동카페', content: '동네 중앙값 매출지수 <span class="up">+5.2%</span>' },
            { location: '신림동', tag: '#신림동치킨', content: '피크타임 이동 <span class="warn">18시→19시</span>' },
            { location: '강남역', tag: '#강남역편의점', content: '원가율 구간 경고 <span class="down">상위 20%</span>' },
            { location: '흑석동', tag: '#흑석동전체', content: '이번 주 평균 객단가 <span class="up">+3.1%</span>' },
            { location: '신림동', tag: '#신림동카페', content: '폐기율 동네 평균 대비 <span class="warn">주의</span>' }
        ];

        for (const item of feedItems) {
            await db.addFeedItem(item);
        }
    }

    /**
     * Render store list
     */
    async renderStores() {
        const stores = await db.getAllStores();
        const container = document.getElementById('storeList');

        if (stores.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <p>등록된 가게가 없습니다.<br>새 가게를 등록해보세요.</p>
                </div>
            `;
            return;
        }

        const categoryLabels = {
            cafe: '카페',
            restaurant: '음식점',
            convenience: '편의점',
            chicken: '치킨',
            bakery: '베이커리'
        };

        container.innerHTML = stores.map(store => `
            <div class="store-card ${this.selectedStoreId === store.id ? 'selected' : ''}"
                 onclick="app.selectStore(${store.id})">
                <div class="store-header">
                    <span class="store-name">${store.name}</span>
                    <span class="store-category">${categoryLabels[store.category] || store.category}</span>
                </div>
                <div class="store-location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${store.location}
                </div>
                <div class="store-metrics">
                    <div class="store-metric">
                        <span class="value">${store.displayData.sales.toLocaleString()}</span>
                        <span class="label">월매출(만원)</span>
                    </div>
                    <div class="store-metric">
                        <span class="value">${store.displayData.costRate}%</span>
                        <span class="label">원가율</span>
                    </div>
                </div>
                <div class="store-encrypted">
                    <span class="encrypted-badge" onclick="event.stopPropagation(); app.viewEncrypted('${store.encryptedData.substring(0, 100)}...')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        암호화됨 (클릭하여 확인)
                    </span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Select a store
     */
    selectStore(storeId) {
        this.selectedStoreId = storeId;
        this.renderStores();
    }

    /**
     * View encrypted data modal
     */
    viewEncrypted(encryptedData) {
        document.getElementById('encryptedDataView').textContent = encryptedData;
        document.getElementById('encryptedModal').style.display = 'flex';
    }

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('encryptedModal').style.display = 'none';
    }

    /**
     * Show add store form
     */
    addNewStore() {
        document.getElementById('addStoreForm').style.display = 'block';
    }

    /**
     * Cancel add store
     */
    cancelAddStore() {
        document.getElementById('addStoreForm').style.display = 'none';
        this.clearAddForm();
    }

    /**
     * Clear add store form
     */
    clearAddForm() {
        document.getElementById('newStoreName').value = '';
        document.getElementById('newStoreCategory').value = 'cafe';
        document.getElementById('newStoreLocation').value = '';
        document.getElementById('newStoreSales').value = '';
        document.getElementById('newStoreCostRate').value = '';
        document.getElementById('newStoreLaborCost').value = '';
        document.getElementById('newStoreRent').value = '';
    }

    /**
     * Save new store
     */
    async saveNewStore() {
        const name = document.getElementById('newStoreName').value.trim();
        const category = document.getElementById('newStoreCategory').value;
        const location = document.getElementById('newStoreLocation').value.trim();
        const sales = parseInt(document.getElementById('newStoreSales').value) || 0;
        const costRate = parseInt(document.getElementById('newStoreCostRate').value) || 0;
        const laborCost = parseInt(document.getElementById('newStoreLaborCost').value) || 0;
        const rent = parseInt(document.getElementById('newStoreRent').value) || 0;

        if (!name || !location) {
            alert('가게명과 동네를 입력해주세요.');
            return;
        }

        // Calculate profit
        const costAmount = Math.round(sales * costRate / 100);
        const profit = sales - costAmount - laborCost - rent;

        // Encrypt sensitive data
        const sensitiveData = { sales, costRate, laborCost, rent, profit };
        const encryptedData = await cryptoEngine.encrypt(sensitiveData);

        await db.addStore({
            name,
            category,
            location,
            encryptedData,
            displayData: sensitiveData
        });

        this.cancelAddStore();
        await this.renderStores();
        await this.updateWalletStats();
    }

    /**
     * Select query type
     */
    selectQueryType(type) {
        this.selectedQueryType = type;

        document.querySelectorAll('.query-type').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Update query cost based on type
        const costs = {
            neighborhood: { cost: 100, tier: 'Silver' },
            category: { cost: 100, tier: 'Silver' },
            ranking: { cost: 1000, tier: 'Gold' }
        };

        const costInfo = costs[type];
        document.getElementById('queryCost').textContent = `${costInfo.cost}원`;
        const tierEl = document.getElementById('queryTier');
        tierEl.textContent = costInfo.tier;
        tierEl.className = `cost-tier ${costInfo.tier.toLowerCase()}`;
    }

    /**
     * Execute FHE query
     */
    async executeQuery() {
        const location = document.getElementById('queryLocation').value;
        const category = document.getElementById('queryCategory').value;
        const metric = document.getElementById('queryMetric').value;

        // Show execution flow
        document.getElementById('executionFlow').style.display = 'block';
        document.getElementById('queryResult').style.display = 'none';

        const steps = ['step1', 'step2', 'step3', 'step4'];

        // Animate steps
        for (let i = 0; i < steps.length; i++) {
            for (const step of steps) {
                document.getElementById(step).classList.remove('active', 'completed');
            }
            document.getElementById(steps[i]).classList.add('active');

            await this.delay(600);

            document.getElementById(steps[i]).classList.remove('active');
            document.getElementById(steps[i]).classList.add('completed');
        }

        // Get matching stores
        let stores = await db.getAllStores();

        if (location !== 'all') {
            stores = stores.filter(s => s.location === location);
        }
        if (category !== 'all') {
            stores = stores.filter(s => s.category === category);
        }

        if (stores.length < 3) {
            // k-anonymity check
            document.getElementById('queryResult').style.display = 'block';
            document.getElementById('resultContent').innerHTML = `
                <div class="result-stat">
                    <span class="value" style="font-size: 24px; color: #EF4444;">조회 불가</span>
                    <span class="label">k-임계치 미달 (최소 3개 점포 필요)</span>
                </div>
            `;
            return;
        }

        // Perform FHE computation
        const encryptedDataArray = stores.map(s => s.encryptedData);
        const metricMap = {
            sales: 'sales',
            costRate: 'costRate',
            laborCost: 'laborCost',
            profit: 'profit'
        };

        let result;
        if (this.selectedQueryType === 'ranking' && this.selectedStoreId) {
            const selectedStore = stores.find(s => s.id === this.selectedStoreId);
            if (selectedStore) {
                result = await cryptoEngine.computeOnEncrypted(
                    encryptedDataArray,
                    'ranking',
                    { field: metricMap[metric], targetValue: selectedStore.displayData[metric] }
                );
            }
        } else {
            result = await cryptoEngine.computeOnEncrypted(
                encryptedDataArray,
                'average',
                { field: metricMap[metric] }
            );
        }

        // Record query
        const queryId = cryptoEngine.generateQueryId();
        const queryCost = this.selectedQueryType === 'ranking' ? 1000 : 100;

        await db.addQuery({
            id: queryId,
            type: this.selectedQueryType,
            location,
            category,
            metric,
            participantCount: result.participantCount,
            cost: queryCost
        });

        // Calculate and record dividends
        const dividendPerStore = Math.round(queryCost * 0.35 / result.participantCount);
        for (const store of stores) {
            await db.addDividend({
                storeId: store.id,
                queryId,
                amount: dividendPerStore,
                metric
            });
        }

        // Generate feed item
        const metricLabels = { sales: '매출', costRate: '원가율', laborCost: '인건비', profit: '순이익' };
        await db.addFeedItem({
            location: location === 'all' ? '전체' : location,
            tag: `#${location === 'all' ? '전체' : location}${category === 'all' ? '' : categoryLabels[category] || ''}`,
            content: `${metricLabels[metric]} 평균 <span class="up">${result.plainResult.average?.toLocaleString() || 0}만원</span> (${result.participantCount}개 점포)`
        });

        // Display result
        this.displayQueryResult(result, queryId, queryCost, stores.length, dividendPerStore, metric);

        // Update UI
        await this.renderDividendHistory();
        await this.renderLocalFeed();
        await this.updateWalletStats();
    }

    /**
     * Display query result
     */
    displayQueryResult(result, queryId, cost, participantCount, dividendPerStore, metric) {
        const metricLabels = { sales: '월매출', costRate: '원가율', laborCost: '인건비', profit: '순이익' };
        const metricUnits = { sales: '만원', costRate: '%', laborCost: '만원', profit: '만원' };

        document.getElementById('queryResult').style.display = 'block';

        let resultHtml = '';
        if (this.selectedQueryType === 'ranking' && result.plainResult.rank) {
            resultHtml = `
                <div class="result-stat">
                    <span class="value">${result.plainResult.rank}</span>
                    <span class="unit">위</span>
                    <span class="label">${result.plainResult.total}개 중 상위 ${result.plainResult.topPercent}%</span>
                </div>
            `;
        } else {
            resultHtml = `
                <div class="result-stat">
                    <span class="value">${result.plainResult.average?.toLocaleString() || 0}</span>
                    <span class="unit">${metricUnits[metric]}</span>
                    <span class="label">${metricLabels[metric]} 평균</span>
                </div>
                <div class="result-comparison">
                    <div class="comparison-item">
                        <span class="value neutral">${result.plainResult.min?.toLocaleString() || 0}</span>
                        <span class="label">최소</span>
                    </div>
                    <div class="comparison-item">
                        <span class="value neutral">${result.plainResult.max?.toLocaleString() || 0}</span>
                        <span class="label">최대</span>
                    </div>
                </div>
            `;
        }

        document.getElementById('resultContent').innerHTML = resultHtml;
        document.getElementById('queryId').textContent = queryId;
        document.getElementById('participantCount').textContent = `${participantCount}개`;
        document.getElementById('totalDividend').textContent = `${(dividendPerStore * participantCount).toLocaleString()}원`;
    }

    /**
     * Render dividend history
     */
    async renderDividendHistory() {
        const dividends = await db.getAllDividends();
        const container = document.getElementById('dividendHistory');

        if (dividends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>아직 배당 내역이 없습니다.</p>
                </div>
            `;
            return;
        }

        // Group by queryId and show latest
        const grouped = {};
        dividends.forEach(d => {
            if (!grouped[d.queryId]) {
                grouped[d.queryId] = {
                    queryId: d.queryId,
                    totalAmount: 0,
                    timestamp: d.timestamp,
                    count: 0
                };
            }
            grouped[d.queryId].totalAmount += d.amount;
            grouped[d.queryId].count++;
        });

        const items = Object.values(grouped).slice(0, 10);

        container.innerHTML = items.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <span class="history-query">${item.queryId}</span>
                    <span class="history-time">${this.formatTime(item.timestamp)} · ${item.count}개 점포</span>
                </div>
                <span class="history-amount">+${item.totalAmount.toLocaleString()}원</span>
            </div>
        `).join('');
    }

    /**
     * Render local feed
     */
    async renderLocalFeed() {
        const feedItems = await db.getAllFeed();
        const container = document.getElementById('localFeed');

        if (feedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>아직 피드가 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = feedItems.slice(0, 10).map(item => `
            <div class="feed-item">
                <span class="feed-tag">${item.tag}</span>
                <p class="feed-content">${item.content}</p>
            </div>
        `).join('');
    }

    /**
     * Update wallet stats
     */
    async updateWalletStats() {
        const stores = await db.getAllStores();
        const queries = await db.getAllQueries();
        const totalDividends = await db.getTotalDividends();

        document.getElementById('totalBalance').textContent = totalDividends.toLocaleString();
        document.getElementById('queryCount').textContent = queries.length;
        document.getElementById('storeCount').textContent = stores.length;
    }

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '방금 전';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
        return `${Math.floor(diff / 86400000)}일 전`;
    }

    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Category labels helper
const categoryLabels = {
    cafe: '카페',
    restaurant: '음식점',
    convenience: '편의점',
    chicken: '치킨',
    bakery: '베이커리'
};

// Create app instance and initialize
const app = new DdalggakApp();

document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
});

// Close modal on outside click
document.getElementById('encryptedModal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        app.closeModal();
    }
});
