/**
 * FHE16 Token Launchpad - Blind Auction + CCA Demo
 */

// ===========================================
// Configuration
// ===========================================
const CONFIG = {
    tokenSymbol: 'WNT',
    totalSupply: 100000000,
    tokensForSale: 10000000,
    tokensPerRound: 3333333,
    targetRaise: 1000000,
    safePrice: 0.10,

    totalRounds: 3,
    roundDurationSeconds: 45,
    minBidPrice: 0.10,
    maxBidPrice: 10.00,
    minQuantity: 1000,
    maxQuantity: 500000,

    myWalletAddress: '8xYk...Fq3P',
    myBalance: 100000
};

// ===========================================
// IndexedDB
// ===========================================
let db = null;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LaunchpadDB', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            console.log('[DB] Ready');
            resolve(db);
        };
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('bids')) {
                database.createObjectStore('bids', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('rounds')) {
                database.createObjectStore('rounds', { keyPath: 'round' });
            }
        };
    });
}

function saveBid(bid) {
    if (!db) return;
    const tx = db.transaction('bids', 'readwrite');
    tx.objectStore('bids').add(bid);
}

function saveRound(data) {
    if (!db) return;
    const tx = db.transaction('rounds', 'readwrite');
    tx.objectStore('rounds').put(data);
}

function getAllBids() {
    return new Promise((resolve) => {
        if (!db) { resolve([]); return; }
        const tx = db.transaction('bids', 'readonly');
        const req = tx.objectStore('bids').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

// ===========================================
// State
// ===========================================
let state = {
    currentRound: 0,
    roundActive: false,
    roundTimeRemaining: CONFIG.roundDurationSeconds,
    currentPriceFloor: CONFIG.minBidPrice,

    currentRoundBids: [],
    myBids: [],
    roundResults: [],

    totalRaised: 0,
    totalTokensDistributed: 0,

    simulationInterval: null,
    timerInterval: null,

    priceChart: null,
    priceHistoryChart: null
};

// ===========================================
// Init
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupUI();
    initCharts();
    generateBidders();
});

function setupUI() {
    document.getElementById('myWalletAddress').textContent = CONFIG.myWalletAddress;
    document.getElementById('myBalance').textContent = `$${CONFIG.myBalance.toLocaleString()}`;
    document.getElementById('totalSupply').textContent = `${CONFIG.tokensPerRound.toLocaleString()} WNT`;

    document.getElementById('bidPrice').value = '0.15';
    document.getElementById('bidQuantity').value = '50000';
    updateBidSummary();

    document.getElementById('bidForm').addEventListener('submit', handleMyBid);
    document.getElementById('bidPrice').addEventListener('input', updateBidSummary);
    document.getElementById('bidQuantity').addEventListener('input', updateBidSummary);
}

function updateBidSummary() {
    const price = parseFloat(document.getElementById('bidPrice').value) || 0;
    const qty = parseInt(document.getElementById('bidQuantity').value) || 0;
    document.getElementById('totalCost').textContent = `$${(price * qty).toLocaleString()}`;
    document.getElementById('maxTokensAtClearing').textContent = qty > 0 ? `~${qty.toLocaleString()} WNT` : '--';
}

// ===========================================
// Dashboard Switch
// ===========================================
function switchDashboard(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('investorDashboard').classList.toggle('active', tab === 'investor');
    document.getElementById('founderDashboard').classList.toggle('active', tab === 'founder');

    if (tab === 'investor') {
        refreshInvestorView();
    }
}

// ===========================================
// Investor: My Bid
// ===========================================
async function handleMyBid(e) {
    e.preventDefault();

    if (!state.roundActive) {
        alert('라운드가 시작되지 않았습니다');
        return;
    }

    const price = parseFloat(document.getElementById('bidPrice').value);
    const quantity = parseInt(document.getElementById('bidQuantity').value);

    if (price < state.currentPriceFloor) {
        alert(`최소가는 $${state.currentPriceFloor.toFixed(2)}입니다`);
        return;
    }

    const totalAmount = price * quantity;
    const bid = {
        bidderId: CONFIG.myWalletAddress,
        price,
        quantity,
        totalAmount,
        round: state.currentRound,
        timestamp: Date.now(),
        encryptedData: randomHex(64),
        isMyBid: true
    };

    state.currentRoundBids.push(bid);
    state.myBids.push(bid);
    saveBid(bid);

    addActivityItem(bid);
    updateStats();
    showMyBids();

    document.getElementById('bidPrice').value = '0.15';
    document.getElementById('bidQuantity').value = '50000';
    updateBidSummary();
}

function showMyBids() {
    const section = document.getElementById('myBidsSection');
    const list = document.getElementById('myBidsList');

    if (state.myBids.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    list.innerHTML = state.myBids.map(bid => {
        const tokenAlloc = bid.tokensAllocated ? `<span class="token-alloc">→ ${bid.tokensAllocated.toLocaleString()} WNT 배정</span>` : '';
        return `
            <div class="my-bid-item">
                <div class="my-bid-info">
                    <span class="bid-price">$${bid.price.toFixed(2)} x ${bid.quantity.toLocaleString()} WNT</span>
                    <span class="bid-qty">라운드 ${bid.round} | $${bid.totalAmount.toLocaleString()}</span>
                    ${tokenAlloc}
                </div>
                <span class="my-bid-status">${bid.tokensAllocated ? '배정완료' : '암호화됨'}</span>
            </div>
        `;
    }).join('');
}

function refreshInvestorView() {
    showMyBids();
    updateStats();
}

// ===========================================
// Founder: Round Control
// ===========================================
function startRound() {
    if (state.currentRound >= CONFIG.totalRounds) {
        alert('모든 라운드가 완료되었습니다');
        return;
    }

    state.currentRound++;
    state.roundActive = true;
    state.roundTimeRemaining = CONFIG.roundDurationSeconds;
    state.currentRoundBids = [];

    document.getElementById('currentRoundDisplay').textContent = `라운드 ${state.currentRound} / ${CONFIG.totalRounds}`;
    document.getElementById('startRoundBtn').disabled = true;
    document.getElementById('endRoundBtn').disabled = false;

    updateRoundSteps();
    startTimer();
    startSimulation();

    addSystemMessage(`라운드 ${state.currentRound} 시작`);
}

function endRound() {
    state.roundActive = false;
    stopSimulation();
    stopTimer();

    document.getElementById('startRoundBtn').disabled = state.currentRound >= CONFIG.totalRounds;
    document.getElementById('endRoundBtn').disabled = true;

    if (state.currentRound >= CONFIG.totalRounds) {
        document.getElementById('finalizeBtn').disabled = false;
    }

    // Calculate round results
    calculateRoundResult();
}

function calculateRoundResult() {
    const bids = state.currentRoundBids;
    if (bids.length === 0) {
        addSystemMessage(`라운드 ${state.currentRound} 종료 - 입찰 없음`);
        return;
    }

    const totalRaised = bids.reduce((sum, b) => sum + b.totalAmount, 0);
    const avgPrice = totalRaised / bids.reduce((sum, b) => sum + b.quantity, 0);
    const tokensThisRound = CONFIG.tokensPerRound;

    // Proportional allocation
    bids.forEach(bid => {
        const proportion = bid.totalAmount / totalRaised;
        bid.tokensAllocated = Math.floor(tokensThisRound * proportion);
    });

    // Update my bids with allocation
    state.myBids.forEach(myBid => {
        if (myBid.round === state.currentRound) {
            const match = bids.find(b => b.bidderId === myBid.bidderId && b.timestamp === myBid.timestamp);
            if (match) {
                myBid.tokensAllocated = match.tokensAllocated;
            }
        }
    });

    const roundData = {
        round: state.currentRound,
        totalRaised,
        avgPrice,
        bidCount: bids.length,
        tokensDistributed: tokensThisRound
    };

    state.roundResults.push(roundData);
    state.totalRaised += totalRaised;
    state.totalTokensDistributed += tokensThisRound;
    state.currentPriceFloor = avgPrice; // CCA: next round floor

    saveRound(roundData);

    // Update UI
    showRoundResult(roundData);
    updatePriceHistoryChart();
    addSystemMessage(`라운드 ${state.currentRound} 종료 - 모금: $${totalRaised.toLocaleString()}, 평균가: $${avgPrice.toFixed(2)}`);
}

function showRoundResult(data) {
    document.getElementById('currentRaised').textContent = `$${state.totalRaised.toLocaleString()}`;
    document.querySelector('#currentClearingPrice .amount').textContent = data.avgPrice.toFixed(2);
    document.getElementById('currentTokenPrice').textContent = `$${data.avgPrice.toFixed(2)}`;

    const roiPercent = ((data.avgPrice - CONFIG.safePrice) / CONFIG.safePrice) * 100;
    document.getElementById('roiGain').textContent = `+${roiPercent.toFixed(0)}%`;

    const fdv = data.avgPrice * CONFIG.totalSupply;
    document.getElementById('impliedFDV').textContent = `$${Math.round(fdv / 1000000)}M`;

    const progressPercent = Math.min(100, (state.totalRaised / CONFIG.targetRaise) * 100);
    const circumference = 2 * Math.PI * 54;
    document.getElementById('progressCircle').style.strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    document.getElementById('saleProgressPercent').textContent = `${Math.round(progressPercent)}%`;

    document.getElementById('roiHighlight').innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>라운드 ${data.round}: $${data.totalRaised.toLocaleString()} 모금, 평균 $${data.avgPrice.toFixed(2)}/토큰</span>
    `;
}

function finalizeSale() {
    if (state.roundResults.length === 0) {
        alert('진행된 라운드가 없습니다');
        return;
    }

    document.getElementById('finalizeBtn').disabled = true;

    const lastResult = state.roundResults[state.roundResults.length - 1];

    document.getElementById('finalClearingPrice').textContent = `$${lastResult.avgPrice.toFixed(2)}`;
    document.getElementById('finalTotalRaised').textContent = `$${state.totalRaised.toLocaleString()}`;
    document.getElementById('finalTokensAllocated').textContent = `${state.totalTokensDistributed.toLocaleString()} WNT`;

    // Show my result
    const myTokens = state.myBids.reduce((sum, b) => sum + (b.tokensAllocated || 0), 0);
    const myContribution = state.myBids.reduce((sum, b) => sum + b.totalAmount, 0);

    document.getElementById('myResult').innerHTML = `
        <h4>내 결과</h4>
        <div class="position-detail"><span>총 기여금</span><span>$${myContribution.toLocaleString()}</span></div>
        <div class="position-detail"><span>배정 토큰</span><span class="success">${myTokens.toLocaleString()} WNT</span></div>
    `;

    document.getElementById('winnerModal').classList.add('active');
}

function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

// ===========================================
// Timer
// ===========================================
function startTimer() {
    const timerEl = document.getElementById('roundTimer');

    state.timerInterval = setInterval(() => {
        if (!state.roundActive) {
            clearInterval(state.timerInterval);
            return;
        }

        state.roundTimeRemaining--;
        const m = Math.floor(state.roundTimeRemaining / 60);
        const s = state.roundTimeRemaining % 60;
        timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        if (state.roundTimeRemaining <= 0) {
            endRound();
        }
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// ===========================================
// Simulation: ~10 bids per second
// ===========================================
let bidders = [];

function generateBidders() {
    bidders = Array.from({ length: 150 }, () => ({
        id: randomHex(4) + '...' + randomHex(4),
        priceMultiplier: 1 + Math.random() * 0.5,
        quantityPref: 10000 + Math.floor(Math.random() * 100000)
    }));
}

function startSimulation() {
    console.log('[SIM] Starting');

    // Fire bids every 100ms = 10/sec
    state.simulationInterval = setInterval(() => {
        if (!state.roundActive) return;

        const bidder = bidders[Math.floor(Math.random() * bidders.length)];

        let price = state.currentPriceFloor * bidder.priceMultiplier * (0.9 + Math.random() * 0.3);
        price = Math.max(state.currentPriceFloor, Math.min(CONFIG.maxBidPrice, price));
        price = Math.round(price * 100) / 100;

        let qty = Math.floor(bidder.quantityPref * (0.5 + Math.random()));
        qty = Math.max(CONFIG.minQuantity, Math.min(CONFIG.maxQuantity, qty));
        qty = Math.round(qty / 1000) * 1000;

        const bid = {
            bidderId: bidder.id,
            price,
            quantity: qty,
            totalAmount: price * qty,
            round: state.currentRound,
            timestamp: Date.now(),
            encryptedData: randomHex(64)
        };

        state.currentRoundBids.push(bid);
        saveBid(bid);

        addActivityItem(bid);
        updateStats();

    }, 100);
}

function stopSimulation() {
    if (state.simulationInterval) {
        clearInterval(state.simulationInterval);
        state.simulationInterval = null;
    }
}

// ===========================================
// UI Updates
// ===========================================
function updateStats() {
    const bids = state.currentRoundBids;
    const uniqueBidders = new Set(bids.map(b => b.bidderId)).size;
    const totalValue = bids.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalDemand = bids.reduce((sum, b) => sum + b.quantity, 0);
    const currentPrice = bids.length > 0 ? totalValue / totalDemand : state.currentPriceFloor;

    document.getElementById('totalBids').textContent = bids.length;
    document.getElementById('totalParticipants').textContent = uniqueBidders;
    document.getElementById('indicativePrice').textContent = `$${currentPrice.toFixed(2)}`;
    document.getElementById('totalDemand').textContent = `${totalDemand.toLocaleString()} WNT`;
    document.getElementById('oversubscription').textContent = `${(totalDemand / CONFIG.tokensPerRound).toFixed(1)}x`;

    document.getElementById('uniqueBidders').textContent = uniqueBidders;
    document.getElementById('participantCount').textContent = `${uniqueBidders}명`;
    document.getElementById('founderTotalDemand').textContent = `${totalDemand.toLocaleString()} WNT`;

    if (bids.length > 0) {
        document.getElementById('avgBidSize').textContent = `$${Math.round(totalValue / bids.length).toLocaleString()}`;
    }

    const elapsed = CONFIG.roundDurationSeconds - state.roundTimeRemaining;
    if (elapsed > 0) {
        document.getElementById('bidFrequency').textContent = `${Math.round(bids.length / elapsed * 60)}/분`;
    }

    // Update founder estimated raise
    const estimatedRaise = state.totalRaised + totalValue;
    document.getElementById('currentRaised').textContent = `$${Math.round(estimatedRaise).toLocaleString()}`;

    const progressPercent = Math.min(100, (estimatedRaise / CONFIG.targetRaise) * 100);
    const circumference = 2 * Math.PI * 54;
    document.getElementById('progressCircle').style.strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    document.getElementById('saleProgressPercent').textContent = `${Math.round(progressPercent)}%`;
}

function addActivityItem(bid) {
    const feed = document.getElementById('activityFeed');
    const placeholder = feed.querySelector('.activity-placeholder');
    if (placeholder) placeholder.remove();

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <div class="activity-content">
            <div class="activity-title">${bid.isMyBid ? '내 입찰' : '새 입찰'}</div>
            <div class="activity-subtitle">${bid.bidderId} | ${bid.encryptedData.substring(0, 16)}...</div>
        </div>
        <div class="activity-time">${time}</div>
    `;

    feed.insertBefore(item, feed.firstChild);
    while (feed.children.length > 30) feed.removeChild(feed.lastChild);

    // Participant list
    const pList = document.getElementById('participantActivityList');
    const empty = pList.querySelector('.activity-empty');
    if (empty) empty.remove();

    const pItem = item.cloneNode(true);
    pList.insertBefore(pItem, pList.firstChild);
    while (pList.children.length > 15) pList.removeChild(pList.lastChild);

    // Latest encrypted
    document.getElementById('latestEncryptedBid').textContent = bid.encryptedData.substring(0, 32) + '...';
}

function addSystemMessage(msg) {
    const feed = document.getElementById('activityFeed');
    const placeholder = feed.querySelector('.activity-placeholder');
    if (placeholder) placeholder.remove();

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="activity-content">
            <div class="activity-title">시스템</div>
            <div class="activity-subtitle">${msg}</div>
        </div>
        <div class="activity-time">${time}</div>
    `;

    feed.insertBefore(item, feed.firstChild);
}

function updateRoundSteps() {
    document.querySelectorAll('.round-step').forEach((step, i) => {
        const num = i + 1;
        step.classList.remove('active', 'completed');
        if (num < state.currentRound) step.classList.add('completed');
        else if (num === state.currentRound) step.classList.add('active');
    });
}

// ===========================================
// Charts
// ===========================================
function initCharts() {
    const ctx1 = document.getElementById('priceChartCanvas').getContext('2d');
    state.priceChart = new Chart(ctx1, {
        type: 'line',
        data: { labels: [], datasets: [{ label: '가격', data: [], borderColor: '#C084FC', backgroundColor: 'rgba(192,132,252,0.2)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { ticks: { callback: v => `$${v.toFixed(2)}` } } } }
    });

    const ctx2 = document.getElementById('priceHistoryCanvas').getContext('2d');
    state.priceHistoryChart = new Chart(ctx2, {
        type: 'bar',
        data: { labels: ['R1', 'R2', 'R3'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#C084FC', '#E879F9', '#86EFAC'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => `$${v}` } } } }
    });

    // Update price chart every 2 sec
    setInterval(() => {
        if (!state.roundActive) return;
        const bids = state.currentRoundBids;
        if (bids.length === 0) return;

        const totalValue = bids.reduce((s, b) => s + b.totalAmount, 0);
        const totalQty = bids.reduce((s, b) => s + b.quantity, 0);
        const price = totalValue / totalQty;

        const now = new Date();
        state.priceChart.data.labels.push(`${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`);
        state.priceChart.data.datasets[0].data.push(price);

        if (state.priceChart.data.labels.length > 20) {
            state.priceChart.data.labels.shift();
            state.priceChart.data.datasets[0].data.shift();
        }
        state.priceChart.update('none');
    }, 2000);
}

function updatePriceHistoryChart() {
    state.roundResults.forEach((r, i) => {
        state.priceHistoryChart.data.datasets[0].data[i] = r.avgPrice;
    });
    state.priceHistoryChart.update();
}

// ===========================================
// Helpers
// ===========================================
function randomHex(len) {
    const chars = '0123456789abcdef';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 16)]).join('');
}

// Styles
const style = document.createElement('style');
style.textContent = `
    .position-detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .position-detail:last-child { border-bottom: none; }
    .position-detail .success { color: #86EFAC; font-weight: 700; }
    .token-alloc { display: block; color: #86EFAC; font-weight: 700; margin-top: 4px; }
    .my-bid-status { font-size: 0.85rem; padding: 4px 8px; border-radius: 6px; background: rgba(192,132,252,0.3); color: #E9D5FF; }
`;
document.head.appendChild(style);
