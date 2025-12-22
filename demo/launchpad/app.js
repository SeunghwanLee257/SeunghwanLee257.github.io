/**
 * FHE16 Token Launchpad - Blind Auction + CCA Demo
 * Main Application Logic
 */

// ===========================================
// Configuration
// ===========================================
const CONFIG = {
    // Token Sale Parameters
    tokenSymbol: 'WNT',
    tokenName: 'WalLLLnut Token',
    totalSupply: 100000000, // 100M total supply
    salePercent: 10, // 10% of total supply for sale
    tokensForSale: 10000000, // 10M tokens (10% of 100M)
    tokensPerRound: 3333333, // ~1/3 per round
    targetRaise: 1000000, // $1M target
    safeValuation: 10000000, // $10M pre-money cap
    safePrice: 0.10, // $0.10 per token from SAFE

    // Auction Parameters (CCA style)
    totalRounds: 3,
    roundDurationSeconds: 45, // 45 seconds per round for demo
    minBidPrice: 0.10, // Starting floor price
    maxBidPrice: 10.00,
    minQuantity: 1000,
    maxQuantity: 500000,

    // Simulation Parameters
    simulationSpeed: 0.15, // Very fast
    minSimulatedBidders: 120,
    maxSimulatedBidders: 250,

    // My Wallet (Demo)
    myWalletAddress: '8xYk...Fq3P',
    myBalance: 100000
};

// ===========================================
// State Management
// ===========================================
let state = {
    currentRound: 0,
    roundActive: false,
    auctionEnded: false,
    roundTimeRemaining: CONFIG.roundDurationSeconds,

    // CCA Price Floor
    currentPriceFloor: CONFIG.minBidPrice,
    roundClearingPrices: [],

    // Bid Data
    currentRoundBids: [],
    allEncryptedBids: [],
    myBids: [],

    // Round Results
    roundResults: [],

    // Statistics
    currentStats: {
        totalBids: 0,
        totalParticipants: 0,
        totalDemand: 0,
        indicativePrice: 0,
        oversubscription: 0,
        totalRaised: 0,
        tokensDistributed: 0
    },

    priceHistory: [],
    lastClearingPrice: 0,

    simulatedBidders: [],
    simulationActive: false,
    simulationInterval: null,

    priceChart: null,
    priceHistoryChart: null
};

// ===========================================
// Initialization
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    await initializeCrypto();
    setupUI();
    initializeCharts();
    generateSimulatedBidders();
    setupEventListeners();
    setupFHELogListener();
});

async function initializeCrypto() {
    try {
        await cryptoEngine.initialize();
        document.getElementById('fheStatus').classList.add('active');
        document.getElementById('fheStatus').querySelector('span').textContent = 'FHE16 활성화';
    } catch (error) {
        console.error('[App] Crypto initialization failed:', error);
    }
}

function setupUI() {
    document.getElementById('myWalletAddress').textContent = CONFIG.myWalletAddress;
    document.getElementById('myBalance').textContent = `$${CONFIG.myBalance.toLocaleString()}`;
    document.getElementById('totalSupply').textContent = `${CONFIG.tokensPerRound.toLocaleString()} ${CONFIG.tokenSymbol}`;
    document.getElementById('saleTokenAmount').textContent = `${CONFIG.tokensForSale.toLocaleString()} ${CONFIG.tokenSymbol} (${CONFIG.salePercent}%)`;

    // Set default values for quick start
    document.getElementById('bidPrice').value = '0.15';
    document.getElementById('bidQuantity').value = '50000';

    updatePriceFloorDisplay();
    updateBidSummary();
}

function updatePriceFloorDisplay() {
    const floorEl = document.getElementById('currentPriceFloor');
    if (floorEl) {
        floorEl.textContent = `$${state.currentPriceFloor.toFixed(2)}`;
    }
    const minPriceInput = document.getElementById('bidPrice');
    if (minPriceInput) {
        minPriceInput.min = state.currentPriceFloor;
        minPriceInput.placeholder = state.currentPriceFloor.toFixed(2);
    }
}

function setupEventListeners() {
    document.getElementById('bidForm').addEventListener('submit', handleBidSubmit);
    document.getElementById('bidPrice').addEventListener('input', updateBidSummary);
    document.getElementById('bidQuantity').addEventListener('input', updateBidSummary);
    window.addEventListener('fhe-log', handleFHELog);
}

function setupFHELogListener() {
    window.addEventListener('fhe-log', (event) => {
        addFHELogEntry(event.detail.message, event.detail.type);
    });
}

// ===========================================
// Dashboard Switching
// ===========================================
function switchDashboard(dashboard) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === dashboard);
    });
    document.querySelectorAll('.dashboard').forEach(d => d.classList.remove('active'));
    document.getElementById(dashboard === 'investor' ? 'investorDashboard' : 'founderDashboard').classList.add('active');
}

// ===========================================
// Bid Form Handling
// ===========================================
function setSuggestedPrice(price) {
    const finalPrice = Math.max(price, state.currentPriceFloor);
    document.getElementById('bidPrice').value = finalPrice.toFixed(2);
    updateBidSummary();
}

function setSuggestedQuantity(quantity) {
    document.getElementById('bidQuantity').value = quantity;
    updateBidSummary();
}

function updateBidSummary() {
    const price = parseFloat(document.getElementById('bidPrice').value) || 0;
    const quantity = parseInt(document.getElementById('bidQuantity').value) || 0;
    const totalCost = price * quantity;

    document.getElementById('totalCost').textContent = `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (state.currentStats.indicativePrice > 0 && price >= state.currentStats.indicativePrice) {
        document.getElementById('maxTokensAtClearing').textContent = `~${quantity.toLocaleString()} ${CONFIG.tokenSymbol}`;
    } else {
        document.getElementById('maxTokensAtClearing').textContent = '--';
    }
}

async function handleBidSubmit(e) {
    e.preventDefault();

    if (!state.roundActive) {
        alert('라운드가 활성화되지 않았습니다. 라운드 시작을 기다려주세요.');
        return;
    }

    const price = parseFloat(document.getElementById('bidPrice').value);
    const quantity = parseInt(document.getElementById('bidQuantity').value);

    if (price < state.currentPriceFloor) {
        alert(`최소 입찰가는 $${state.currentPriceFloor.toFixed(2)} 입니다 (CCA 가격 하한)`);
        return;
    }

    if (quantity < CONFIG.minQuantity || quantity > CONFIG.maxQuantity) {
        alert(`수량은 ${CONFIG.minQuantity.toLocaleString()} ~ ${CONFIG.maxQuantity.toLocaleString()} 토큰 사이여야 합니다`);
        return;
    }

    const totalCost = price * quantity;
    if (totalCost > CONFIG.myBalance) {
        alert('잔액이 부족합니다');
        return;
    }

    const submitBtn = document.getElementById('submitBidBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-small"></span> 암호화 중...';

    try {
        const encryptedBid = await cryptoEngine.createEncryptedBid(price, quantity, CONFIG.myWalletAddress);

        state.currentRoundBids.push(encryptedBid);
        state.allEncryptedBids.push(encryptedBid);
        state.myBids.push({
            ...encryptedBid,
            price, quantity,
            round: state.currentRound,
            totalCost
        });

        addActivityItem('bid', CONFIG.myWalletAddress, encryptedBid.encryptedData);
        updateLatestEncryptedBid(encryptedBid.encryptedData);
        updateMyBidsDisplay();
        await updateStatistics();

        document.getElementById('bidPrice').value = '';
        document.getElementById('bidQuantity').value = '';
        updateBidSummary();

    } catch (error) {
        console.error('[App] Bid error:', error);
        alert('입찰 실패. 다시 시도해주세요.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 암호화 & 입찰`;
    }
}

function updateMyBidsDisplay() {
    const section = document.getElementById('myBidsSection');
    const list = document.getElementById('myBidsList');

    if (state.myBids.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    list.innerHTML = state.myBids.map(bid => `
        <div class="my-bid-item">
            <div class="my-bid-info">
                <span class="bid-price">$${bid.price.toFixed(2)} x ${bid.quantity.toLocaleString()} ${CONFIG.tokenSymbol}</span>
                <span class="bid-qty">라운드 ${bid.round} | 총액: $${bid.totalCost.toLocaleString()}</span>
            </div>
            <span class="my-bid-status">암호화됨</span>
        </div>
    `).join('');
}

// ===========================================
// Round Control
// ===========================================
function startRound() {
    if (state.currentRound >= CONFIG.totalRounds) {
        alert('모든 라운드가 완료되었습니다. 세일을 종료해주세요.');
        return;
    }

    state.currentRound++;
    state.roundActive = true;
    state.roundTimeRemaining = CONFIG.roundDurationSeconds;
    state.currentRoundBids = [];

    updateRoundDisplay();
    updateRoundSteps();
    updatePriceFloorDisplay();

    document.getElementById('startRoundBtn').disabled = true;
    document.getElementById('endRoundBtn').disabled = false;

    startRoundTimer();
    startSimulation();

    addActivityItem('round', '시스템', `라운드 ${state.currentRound} 시작 (최소가: $${state.currentPriceFloor.toFixed(2)})`);
    cryptoEngine.log(`라운드 ${state.currentRound} 시작 - 가격 하한: $${state.currentPriceFloor.toFixed(2)}`, 'info');
}

function endRound() {
    state.roundActive = false;
    stopSimulation();

    document.getElementById('startRoundBtn').disabled = state.currentRound >= CONFIG.totalRounds;
    document.getElementById('endRoundBtn').disabled = true;

    if (state.currentRound >= CONFIG.totalRounds) {
        document.getElementById('finalizeBtn').disabled = false;
    }

    calculateRoundClearing();
    addActivityItem('round', '시스템', `라운드 ${state.currentRound} 종료`);
    cryptoEngine.log(`라운드 ${state.currentRound} 종료`, 'info');
}

function startRoundTimer() {
    const timerElement = document.getElementById('roundTimer');

    const interval = setInterval(() => {
        if (!state.roundActive) {
            clearInterval(interval);
            return;
        }

        state.roundTimeRemaining--;
        const minutes = Math.floor(state.roundTimeRemaining / 60);
        const seconds = state.roundTimeRemaining % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (state.roundTimeRemaining <= 0) {
            clearInterval(interval);
            endRound();
        }
    }, 1000);
}

function updateRoundDisplay() {
    document.getElementById('currentRoundDisplay').textContent = `라운드 ${state.currentRound} / ${CONFIG.totalRounds}`;
}

function updateRoundSteps() {
    document.querySelectorAll('.round-step').forEach((step, index) => {
        const roundNum = index + 1;
        step.classList.remove('active', 'completed');
        if (roundNum < state.currentRound) step.classList.add('completed');
        else if (roundNum === state.currentRound) step.classList.add('active');
    });
}

async function calculateRoundClearing() {
    if (state.currentRoundBids.length === 0) {
        state.roundClearingPrices.push(state.currentPriceFloor);
        return;
    }

    showFHEModal();

    try {
        // CCA: Calculate clearing price for this round's 1/3 allocation
        const result = await cryptoEngine.computeOnEncryptedBids(
            state.currentRoundBids,
            'calculateClearingPrice',
            { totalSupply: CONFIG.tokensPerRound, minPrice: state.currentPriceFloor }
        );

        const clearingData = await cryptoEngine.decrypt(result.encryptedResult);

        // Calculate token price: Total Amount / Tokens for this round
        const totalBidValue = state.currentRoundBids.length > 0 ?
            (await Promise.all(state.currentRoundBids.map(b => cryptoEngine.decrypt(b.encryptedData))))
                .reduce((sum, bid) => sum + (bid.pricePerToken * bid.quantity), 0) : 0;

        const tokenPrice = totalBidValue / CONFIG.tokensPerRound;
        const roundClearingPrice = Math.max(tokenPrice, state.currentPriceFloor, clearingData.clearingPrice);

        // Store round results
        state.roundClearingPrices.push(roundClearingPrice);
        state.lastClearingPrice = roundClearingPrice;

        // Distribute 1/3 of tokens at clearing price
        const tokensThisRound = CONFIG.tokensPerRound;
        const raisedThisRound = tokensThisRound * roundClearingPrice;

        state.currentStats.totalRaised += raisedThisRound;
        state.currentStats.tokensDistributed += tokensThisRound;

        state.roundResults.push({
            round: state.currentRound,
            clearingPrice: roundClearingPrice,
            tokensAllocated: tokensThisRound,
            totalRaised: raisedThisRound,
            bidCount: state.currentRoundBids.length
        });

        state.priceHistory.push({
            round: state.currentRound,
            price: roundClearingPrice,
            demand: clearingData.totalDemand,
            raised: raisedThisRound
        });

        // CCA: Set next round's price floor to this round's clearing price
        state.currentPriceFloor = roundClearingPrice;

        // Update UI
        updatePricingDisplay({
            clearingPrice: roundClearingPrice,
            totalDemand: clearingData.totalDemand
        });
        updatePriceHistoryChart();
        updateFounderDashboard();

        setTimeout(() => hideFHEModal(), 1500);

    } catch (error) {
        console.error('[App] Clearing calculation error:', error);
        hideFHEModal();
    }
}

async function finalizeSale() {
    if (state.roundResults.length === 0) {
        alert('진행된 라운드가 없습니다');
        return;
    }

    state.auctionEnded = true;
    showFHEModal();

    try {
        const finalPrice = state.lastClearingPrice;
        const totalRaised = state.currentStats.totalRaised;
        const tokensDistributed = state.currentStats.tokensDistributed;

        // Determine final allocations
        const winnersResult = await cryptoEngine.computeOnEncryptedBids(
            state.allEncryptedBids,
            'determineWinners',
            { totalSupply: CONFIG.tokensForSale, clearingPrice: finalPrice }
        );

        const winnersData = await cryptoEngine.decrypt(winnersResult.encryptedResult);

        document.getElementById('finalizeBtn').disabled = true;

        setTimeout(() => {
            hideFHEModal();
            showWinnerModal({ clearingPrice: finalPrice }, {
                ...winnersData,
                totalRaised: totalRaised,
                totalAllocated: tokensDistributed
            });
        }, 1500);

    } catch (error) {
        console.error('[App] Finalization error:', error);
        hideFHEModal();
    }
}

// ===========================================
// Simulation
// ===========================================
function generateSimulatedBidders() {
    const count = Math.floor(Math.random() * (CONFIG.maxSimulatedBidders - CONFIG.minSimulatedBidders)) + CONFIG.minSimulatedBidders;

    state.simulatedBidders = Array.from({ length: count }, () => {
        const chars = '0123456789ABCDEFabcdef';
        const prefix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

        return {
            id: `${prefix}...${suffix}`,
            bidProbability: 0.8 + Math.random() * 0.2,
            priceMultiplier: 1 + Math.random() * 0.5, // Bid 1x-1.5x above floor
            quantityPreference: CONFIG.minQuantity * 10 + Math.floor(Math.random() * CONFIG.maxQuantity),
            bidCount: 0
        };
    });
}

function startSimulation() {
    if (state.simulationActive) return;
    state.simulationActive = true;

    // Target: ~10 bids per second on average
    // Fire individual bids at random intervals averaging 100ms
    const scheduleNextBid = () => {
        if (!state.simulationActive || !state.roundActive) return;

        // Random delay between 50ms and 150ms (averaging ~100ms = 10 bids/sec)
        const delay = 50 + Math.random() * 100;

        state.simulationInterval = setTimeout(async () => {
            await simulateBid();
            scheduleNextBid();
        }, delay);
    };

    // Start multiple parallel streams for more bids
    scheduleNextBid();
}

function stopSimulation() {
    state.simulationActive = false;
    if (state.simulationInterval) {
        clearTimeout(state.simulationInterval);
        state.simulationInterval = null;
    }
}

async function simulateBid() {
    if (!state.roundActive || state.simulatedBidders.length === 0) return;

    const bidder = state.simulatedBidders[Math.floor(Math.random() * state.simulatedBidders.length)];

    // CCA: Bid must be at or above current price floor
    let price = state.currentPriceFloor * bidder.priceMultiplier * (1 + (Math.random() - 0.3) * 0.3);
    price = Math.max(state.currentPriceFloor, Math.min(CONFIG.maxBidPrice, price));
    price = Math.round(price * 100) / 100;

    let quantity = Math.floor(bidder.quantityPreference * (0.5 + Math.random()));
    quantity = Math.max(CONFIG.minQuantity, Math.min(CONFIG.maxQuantity, quantity));
    quantity = Math.round(quantity / 1000) * 1000;

    try {
        const encryptedBid = await cryptoEngine.createEncryptedBid(price, quantity, bidder.id);

        state.currentRoundBids.push(encryptedBid);
        state.allEncryptedBids.push(encryptedBid);
        bidder.bidCount++;

        addActivityItem('bid', bidder.id, encryptedBid.encryptedData);
        updateLatestEncryptedBid(encryptedBid.encryptedData);
        addParticipantActivity(bidder.id, encryptedBid);

        if (state.currentRoundBids.length % 8 === 0) {
            await updateStatistics();
        } else {
            quickStatsUpdate();
        }
    } catch (error) {
        console.error('[App] Simulation error:', error);
    }
}

function quickStatsUpdate() {
    const uniqueBidders = new Set(state.currentRoundBids.map(b => b.bidderId)).size;
    state.currentStats.totalBids = state.allEncryptedBids.length;
    state.currentStats.totalParticipants = uniqueBidders;

    document.getElementById('totalBids').textContent = state.currentStats.totalBids;
    document.getElementById('totalParticipants').textContent = state.currentStats.totalParticipants;
    document.getElementById('uniqueBidders').textContent = uniqueBidders;
    document.getElementById('participantCount').textContent = `${uniqueBidders}명 참여`;

    const elapsed = CONFIG.roundDurationSeconds - state.roundTimeRemaining;
    const bidFrequency = elapsed > 0 ? Math.round(state.currentRoundBids.length / (elapsed / 60) * 10) / 10 : 0;
    document.getElementById('bidFrequency').textContent = `${bidFrequency}/분`;
}

async function updateStatistics() {
    if (state.currentRoundBids.length === 0) return;

    try {
        const statsResult = await cryptoEngine.computeOnEncryptedBids(
            state.currentRoundBids,
            'getRoundStatistics',
            { roundNumber: state.currentRound }
        );
        const stats = await cryptoEngine.decrypt(statsResult.encryptedResult);

        const clearingResult = await cryptoEngine.computeOnEncryptedBids(
            state.currentRoundBids,
            'calculateClearingPrice',
            { totalSupply: CONFIG.tokensPerRound, minPrice: state.currentPriceFloor }
        );
        const clearing = await cryptoEngine.decrypt(clearingResult.encryptedResult);

        state.currentStats.totalBids = state.allEncryptedBids.length;
        state.currentStats.totalParticipants = new Set(state.currentRoundBids.map(b => b.bidderId)).size;
        state.currentStats.totalDemand = stats.totalDemand;
        state.currentStats.indicativePrice = Math.max(clearing.clearingPrice, state.currentPriceFloor);
        state.currentStats.oversubscription = clearing.oversubscriptionRatio;

        updateInvestorStats();
        updateFounderStats(stats, clearing);
        updatePriceChart(clearing);

    } catch (error) {
        console.error('[App] Statistics error:', error);
    }
}

function updateInvestorStats() {
    const stats = state.currentStats;
    document.getElementById('totalBids').textContent = stats.totalBids;
    document.getElementById('totalParticipants').textContent = stats.totalParticipants;
    document.getElementById('indicativePrice').textContent = `$${stats.indicativePrice.toFixed(2)}`;
    document.getElementById('totalDemand').textContent = `${stats.totalDemand.toLocaleString()} ${CONFIG.tokenSymbol}`;
    document.getElementById('oversubscription').textContent = `${stats.oversubscription.toFixed(1)}x`;
    updateMyPosition();
}

function updateMyPosition() {
    const positionInfo = document.getElementById('myPositionInfo');
    if (state.myBids.length === 0) {
        positionInfo.innerHTML = '<p class="no-bid">입찰하면 예상 포지션을 확인할 수 있습니다</p>';
        return;
    }

    const myHighestBid = Math.max(...state.myBids.map(b => b.price));
    const myTotalQuantity = state.myBids.reduce((sum, b) => sum + b.quantity, 0);
    const status = myHighestBid >= state.lastClearingPrice ? '배정 예상' : '가격 하한 미달';
    const statusClass = myHighestBid >= state.lastClearingPrice ? 'success' : 'warning';

    positionInfo.innerHTML = `
        <div class="position-detail"><span class="detail-label">내 최고 입찰가</span><span class="detail-value">$${myHighestBid.toFixed(2)}</span></div>
        <div class="position-detail"><span class="detail-label">총 신청 수량</span><span class="detail-value">${myTotalQuantity.toLocaleString()} ${CONFIG.tokenSymbol}</span></div>
        <div class="position-detail"><span class="detail-label">상태</span><span class="detail-value ${statusClass}">${status}</span></div>
    `;
}

function updateFounderStats(stats, clearing) {
    const currentPrice = Math.max(clearing.clearingPrice, state.currentPriceFloor);
    const estimatedRaise = state.currentStats.totalRaised + (CONFIG.tokensPerRound * currentPrice);
    const progressPercent = Math.min(100, (estimatedRaise / CONFIG.targetRaise) * 100);

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (progressPercent / 100) * circumference;
    document.getElementById('progressCircle').style.strokeDashoffset = offset;
    document.getElementById('saleProgressPercent').textContent = `${Math.round(progressPercent)}%`;

    document.getElementById('currentRaised').textContent = `$${Math.round(estimatedRaise).toLocaleString()}`;
    document.getElementById('founderTotalDemand').textContent = `${stats.totalDemand.toLocaleString()} ${CONFIG.tokenSymbol}`;
    document.getElementById('uniqueBidders').textContent = state.currentStats.totalParticipants;
    document.getElementById('avgBidSize').textContent = `$${Math.round(stats.totalValue / stats.bidCount).toLocaleString()}`;

    updatePricingDisplay(clearing);
}

function updateFounderDashboard() {
    const totalRaised = state.currentStats.totalRaised;
    const progressPercent = Math.min(100, (totalRaised / CONFIG.targetRaise) * 100);

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (progressPercent / 100) * circumference;
    document.getElementById('progressCircle').style.strokeDashoffset = offset;
    document.getElementById('saleProgressPercent').textContent = `${Math.round(progressPercent)}%`;
    document.getElementById('currentRaised').textContent = `$${Math.round(totalRaised).toLocaleString()}`;
}

function updatePricingDisplay(clearing) {
    const price = Math.max(clearing.clearingPrice || state.lastClearingPrice, state.currentPriceFloor);

    document.querySelector('#currentClearingPrice .amount').textContent = price.toFixed(2);
    document.getElementById('currentTokenPrice').textContent = `$${price.toFixed(2)}`;

    const roiPercent = ((price - CONFIG.safePrice) / CONFIG.safePrice) * 100;
    document.getElementById('roiGain').textContent = `+${roiPercent.toFixed(0)}%`;

    if (state.priceHistory.length > 1) {
        const prevPrice = state.priceHistory[state.priceHistory.length - 2].price;
        const change = ((price - prevPrice) / prevPrice) * 100;
        const changeEl = document.getElementById('priceChange');
        changeEl.querySelector('.change-value').textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.querySelector('.change-icon').className = `change-icon ${change >= 0 ? 'up' : 'down'}`;
    }

    const impliedFDV = price * CONFIG.totalSupply;
    document.getElementById('impliedFDV').textContent = `$${Math.round(impliedFDV / 1000000)}M`;

    const roiHighlight = document.getElementById('roiHighlight');
    const additionalValue = Math.round((price - CONFIG.safePrice) * CONFIG.tokensForSale);
    roiHighlight.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
        <span>SAFE 대비 +${roiPercent.toFixed(0)}% 상승 ($${additionalValue.toLocaleString()} 추가 가치)</span>
    `;
}

// ===========================================
// UI Updates
// ===========================================
function addActivityItem(type, actor, data) {
    const feed = document.getElementById('activityFeed');
    const placeholder = feed.querySelector('.activity-placeholder');
    if (placeholder) placeholder.remove();

    const item = document.createElement('div');
    item.className = 'activity-item';

    let icon, title, subtitle;
    if (type === 'bid') {
        icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
        title = '새 암호화 입찰';
        subtitle = `${actor} | ${cryptoEngine.formatForDisplay(data, 20)}`;
    } else {
        icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
        title = data;
        subtitle = actor;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    item.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
            <div class="activity-title">${title}</div>
            <div class="activity-subtitle">${subtitle}</div>
        </div>
        <div class="activity-time">${timeStr}</div>
    `;

    feed.insertBefore(item, feed.firstChild);
    while (feed.children.length > 50) feed.removeChild(feed.lastChild);
}

function addParticipantActivity(bidderId, encryptedBid) {
    const list = document.getElementById('participantActivityList');
    const empty = list.querySelector('.activity-empty');
    if (empty) empty.remove();

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <div class="activity-content">
            <div class="activity-title">${bidderId}</div>
            <div class="activity-subtitle">${cryptoEngine.formatForDisplay(encryptedBid.encryptedData, 16)}</div>
        </div>
        <div class="activity-time">${timeStr}</div>
    `;

    list.insertBefore(item, list.firstChild);
    while (list.children.length > 20) list.removeChild(list.lastChild);
}

function updateLatestEncryptedBid(encryptedHex) {
    document.getElementById('latestEncryptedBid').textContent = cryptoEngine.formatForDisplay(encryptedHex, 48);
}

function addFHELogEntry(message, type = 'info') {
    const log = document.getElementById('fheOperationLog');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-msg ${type}">${message}</span>`;

    log.insertBefore(entry, log.firstChild);
    while (log.children.length > 30) log.removeChild(log.lastChild);
}

function handleFHELog(event) {
    addFHELogEntry(event.detail.message, event.detail.type);
}

// ===========================================
// Charts
// ===========================================
function initializeCharts() {
    const priceCtx = document.getElementById('priceChartCanvas').getContext('2d');
    state.priceChart = new Chart(priceCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: '예상 가격', data: [], borderColor: '#818CF8', backgroundColor: 'rgba(129, 140, 248, 0.2)', fill: true, tension: 0.4, pointRadius: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#CBD5E1', font: { size: 14 } } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#CBD5E1', font: { size: 14 }, callback: v => `$${v.toFixed(2)}` } }
            }
        }
    });

    const historyCtx = document.getElementById('priceHistoryCanvas').getContext('2d');
    state.priceHistoryChart = new Chart(historyCtx, {
        type: 'bar',
        data: {
            labels: ['라운드 1', '라운드 2', '라운드 3'],
            datasets: [{ label: '청산가', data: [0, 0, 0], backgroundColor: ['rgba(129, 140, 248, 0.8)', 'rgba(167, 139, 250, 0.8)', 'rgba(52, 211, 153, 0.8)'], borderColor: ['#818CF8', '#A78BFA', '#34D399'], borderWidth: 2, borderRadius: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#CBD5E1', font: { size: 14, weight: 'bold' } } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#CBD5E1', font: { size: 14 }, callback: v => `$${v.toFixed(2)}` }, beginAtZero: true }
            }
        }
    });
}

function updatePriceChart(clearing) {
    const chart = state.priceChart;
    const now = new Date();
    const timeLabel = `${now.getMinutes()}:${now.getSeconds().toString().padStart(2, '0')}`;

    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(Math.max(clearing.clearingPrice, state.currentPriceFloor));

    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update('none');
}

function updatePriceHistoryChart() {
    const chart = state.priceHistoryChart;
    state.priceHistory.forEach((entry) => {
        chart.data.datasets[0].data[entry.round - 1] = entry.price;
    });
    chart.update();
}

// ===========================================
// Modals
// ===========================================
function showFHEModal() {
    const modal = document.getElementById('fheModal');
    modal.classList.add('active');

    document.querySelectorAll('.fhe-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });

    setTimeout(() => { document.getElementById('fheStep1').classList.replace('active', 'completed'); document.getElementById('fheStep2').classList.add('active'); }, 600);
    setTimeout(() => { document.getElementById('fheStep2').classList.replace('active', 'completed'); document.getElementById('fheStep3').classList.add('active'); }, 1200);
    setTimeout(() => { document.getElementById('fheStep3').classList.replace('active', 'completed'); }, 1800);
}

function hideFHEModal() {
    document.getElementById('fheModal').classList.remove('active');
}

function showWinnerModal(clearing, winners) {
    const modal = document.getElementById('winnerModal');
    modal.classList.add('active');

    document.getElementById('finalClearingPrice').textContent = `$${clearing.clearingPrice.toFixed(2)}`;
    document.getElementById('finalTotalRaised').textContent = `$${Math.round(winners.totalRaised).toLocaleString()}`;
    document.getElementById('finalTokensAllocated').textContent = `${winners.totalAllocated.toLocaleString()} ${CONFIG.tokenSymbol}`;

    const winnerList = document.getElementById('winnerList');
    winnerList.innerHTML = winners.winners.slice(0, 10).map(w => `
        <div class="winner-item">
            <div class="winner-info">
                <span class="winner-id">${w.bidderId}</span>
                <span class="winner-allocation">${w.allocatedQuantity.toLocaleString()} ${CONFIG.tokenSymbol} @ $${w.pricePerToken.toFixed(2)}</span>
            </div>
            <span class="winner-status ${w.status === 'fully_filled' ? 'fully' : 'partial'}">${w.status === 'fully_filled' ? '전량 배정' : '일부 배정'}</span>
        </div>
    `).join('');

    const myResult = document.getElementById('myResult');
    const myWin = winners.winners.find(w => w.bidderId === CONFIG.myWalletAddress);

    if (myWin) {
        myResult.innerHTML = `
            <h4>내 결과</h4>
            <div class="position-detail"><span class="detail-label">배정 수량</span><span class="detail-value success">${myWin.allocatedQuantity.toLocaleString()} ${CONFIG.tokenSymbol}</span></div>
            <div class="position-detail"><span class="detail-label">총 비용</span><span class="detail-value">$${myWin.totalCost.toLocaleString()}</span></div>
            <div class="position-detail"><span class="detail-label">상태</span><span class="detail-value success">${myWin.status === 'fully_filled' ? '전량 배정' : '일부 배정'}</span></div>
        `;
    } else if (state.myBids.length > 0) {
        myResult.innerHTML = `<h4>내 결과</h4><div class="position-detail"><span class="detail-label">상태</span><span class="detail-value warning">미배정 - 청산가 미달</span></div>`;
    } else {
        myResult.innerHTML = `<h4>내 결과</h4><div class="position-detail"><span class="detail-label">상태</span><span class="detail-value">입찰 없음</span></div>`;
    }
}

function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

// Styles
const style = document.createElement('style');
style.textContent = `
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .position-detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); }
    .position-detail:last-child { border-bottom: none; }
    .detail-label { color: #CBD5E1; font-size: 1rem; }
    .detail-value { font-weight: 700; color: #FFFFFF; font-size: 1rem; }
    .detail-value.success { color: #34D399; }
    .detail-value.warning { color: #FBBF24; }
`;
document.head.appendChild(style);
