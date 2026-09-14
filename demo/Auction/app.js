/**
 * Confidential Auction Demo Application
 * SELLAN SDK + FHE16 browser diagnostic. No real identity, payment or privacy claim.
 */
import { cryptoEngine } from './auction-sdk.js';

class AuctionApp {
    constructor() {
        this.lots = [];
        this.currentLot = null;
        this.bids = new Map();
        this.currentUserId = 'user_' + Math.random().toString(36).substring(7);
        this.isKYCVerified = false;
        this.timerInterval = null;
        this.submitting = false;
        this.resolving = false;
        this.previewVersion = 0;
    }

    async initialize() {
        console.log('[App] Initializing Confidential Auction Demo...');

        // FHE assets load only when the SDK actually compares bids.
        console.log('[App] SELLAN auction SDK ready');

        // Load sample lots
        await this.loadSampleLots();

        // Setup event listeners
        this.setupEventListeners();

        // Render UI
        this.renderLotList();
        this.updateStats();
        this.startTimer();

        console.log('[App] Application initialized');
    }

    async loadSampleLots() {
        const sampleLots = [
            {
                id: 'lot_001',
                title: '김환기 - 산월 (Mountain and Moon)',
                artist: '김환기 (Kim Whanki)',
                year: 1964,
                medium: '캔버스에 유채',
                size: '130 x 97 cm',
                estimate: { low: 800000000, high: 1200000000 },
                startingBid: 500000000,
                status: 'active',
                endTime: Date.now() + 3600000
            },
            {
                id: 'lot_002',
                title: '박수근 - 빨래터 (Washing Place)',
                artist: '박수근 (Park Soo-keun)',
                year: 1962,
                medium: '하드보드에 유채',
                size: '45 x 38 cm',
                estimate: { low: 500000000, high: 700000000 },
                startingBid: 300000000,
                status: 'active',
                endTime: Date.now() + 7200000
            },
            {
                id: 'lot_003',
                title: '이우환 - 점으로부터 (From Point)',
                artist: '이우환 (Lee Ufan)',
                year: 1978,
                medium: '캔버스에 미네랄 피그먼트',
                size: '182 x 227 cm',
                estimate: { low: 600000000, high: 900000000 },
                startingBid: 400000000,
                status: 'active',
                endTime: Date.now() + 5400000
            },
            {
                id: 'lot_004',
                title: '백남준 - TV 부처 (TV Buddha)',
                artist: '백남준 (Nam June Paik)',
                year: 1974,
                medium: '비디오 설치',
                size: '가변 크기',
                estimate: { low: 1500000000, high: 2000000000 },
                startingBid: 1000000000,
                status: 'upcoming',
                endTime: Date.now() + 86400000
            },
            {
                id: 'lot_005',
                title: '천경자 - 노란 산책 (Yellow Stroll)',
                artist: '천경자 (Chun Kyung-ja)',
                year: 1983,
                medium: '종이에 채색',
                size: '90 x 60 cm',
                estimate: { low: 200000000, high: 350000000 },
                startingBid: 150000000,
                status: 'active',
                endTime: Date.now() + 1800000
            }
        ];

        for (const lot of sampleLots) {
            this.lots.push(lot);
            this.bids.set(lot.id, []);

            // Add demo bids
            if (lot.status === 'active') {
                await this.addDemoBids(lot);
            }
        }

        console.log(`[App] Loaded ${this.lots.length} auction lots`);
    }

    async addDemoBids(lot) {
        const numBids = Math.floor(Math.random() * 5) + 2;
        const bids = this.bids.get(lot.id);

        for (let i = 0; i < numBids; i++) {
            const bidAmount = lot.startingBid + Math.floor(Math.random() * (lot.estimate.low - lot.startingBid));
            const fakeBidderId = 'bidder_' + Math.random().toString(36).substring(7);
            const encryptedBid = await cryptoEngine.createBid(bidAmount, fakeBidderId);
            bids.push(encryptedBid);
        }
    }

    setupEventListeners() {
        // Bid amount input
        const bidAmountInput = document.getElementById('bidAmount');
        if (bidAmountInput) {
            bidAmountInput.addEventListener('input', (e) => {
                this.updateEncryptionPreview(e.target.value);
            });
        }
    }

    renderLotList() {
        const container = document.getElementById('lotList');
        if (!container) return;

        container.innerHTML = this.lots.map(lot => {
            const bids = this.bids.get(lot.id) || [];
            const heatClass = this.getHeatClass(bids.length);
            const timeLeft = this.getTimeLeft(lot.endTime);
            const isSelected = this.currentLot?.id === lot.id;

            return `
                <div class="lot-card ${isSelected ? 'selected' : ''}" onclick="app.selectLot('${lot.id}')">
                    <div class="lot-card-header">
                        <span class="lot-card-number">LOT ${lot.id.split('_')[1]}</span>
                        <span class="lot-heat ${heatClass}"></span>
                    </div>
                    <div class="lot-card-title">${lot.title}</div>
                    <div class="lot-card-artist">${lot.artist}</div>
                    <div class="lot-card-footer">
                        <span class="lot-card-bids">${bids.length} bids</span>
                        <span class="lot-card-time">${timeLeft}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    getHeatClass(bidCount) {
        if (bidCount >= 5) return 'hot';
        if (bidCount >= 3) return 'warm';
        return 'cool';
    }

    getTimeLeft(endTime) {
        const diff = endTime - Date.now();
        if (diff <= 0) return '종료';

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            // Update lot list times
            this.lots.forEach(lot => {
                const card = document.querySelector(`.lot-card[onclick*="${lot.id}"] .lot-card-time`);
                if (card) {
                    card.textContent = this.getTimeLeft(lot.endTime);
                }
            });

            // Update main timer if lot selected
            if (this.currentLot) {
                const timer = document.getElementById('auctionTimer');
                if (timer) {
                    const diff = this.currentLot.endTime - Date.now();
                    if (diff > 0) {
                        const h = Math.floor(diff / 3600000);
                        const m = Math.floor((diff % 3600000) / 60000);
                        const s = Math.floor((diff % 60000) / 1000);
                        timer.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    } else {
                        timer.textContent = '종료됨';
                    }
                }
            }
        }, 1000);
    }

    selectLot(lotId) {
        this.currentLot = this.lots.find(l => l.id === lotId);
        if (!this.currentLot) return;

        console.log(`[App] Selected: ${this.currentLot.title}`);

        // Update lot list selection
        document.querySelectorAll('.lot-card').forEach(card => {
            card.classList.remove('selected');
            if (card.onclick?.toString().includes(lotId)) {
                card.classList.add('selected');
            }
        });

        // Show bid section
        document.getElementById('noSelection').style.display = 'none';
        document.getElementById('selectedLotSection').style.display = 'flex';

        // Update lot details
        const lot = this.currentLot;
        document.getElementById('lotNumber').textContent = `LOT ${lot.id.split('_')[1]}`;
        document.getElementById('lotTitle').textContent = lot.title;
        document.getElementById('lotArtist').textContent = lot.artist;
        document.getElementById('lotYear').textContent = lot.year;
        document.getElementById('lotMedium').textContent = lot.medium;
        document.getElementById('lotSize').textContent = lot.size;
        document.getElementById('lotEstimate').textContent = `${this.formatCurrency(lot.estimate.low)} - ${this.formatCurrency(lot.estimate.high)}`;
        document.getElementById('lotStarting').textContent = this.formatCurrency(lot.startingBid);

        // Status badge
        const statusBadge = document.getElementById('lotStatusBadge');
        statusBadge.textContent = lot.status === 'active' ? '진행중' : '예정';
        statusBadge.className = `lot-status-badge ${lot.status === 'upcoming' ? 'upcoming' : ''}`;

        // Clear bid input
        document.getElementById('bidAmount').value = '';
        document.getElementById('previewCode').textContent = '금액을 입력하면 기록 해시가 표시됩니다';

        // Update stats
        this.updateStats();
        this.updateSelectedLotStats();
    }

    async updateEncryptionPreview(value) {
        const code = document.getElementById('previewCode');
        if (!code) return;

        const version = ++this.previewVersion;
        const amount = Number(value);
        if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647) {
            code.textContent = '1~2,147,483,647원 사이의 정수를 입력해주세요';
            return;
        }

        try {
            const commitment = await cryptoEngine.preview(amount);
            if (version === this.previewVersion) code.textContent = cryptoEngine.formatForDisplay(commitment, 50);
        } catch (error) { if (version === this.previewVersion) code.textContent = error.message; }
    }

    addBidAmount(amount) {
        const input = document.getElementById('bidAmount');
        if (!input) return;

        const current = Number(input.value) || 0;
        input.value = current + amount;
        this.updateEncryptionPreview(input.value);
    }

    verifyKYC() {
        const kycStatus = document.getElementById('kycStatus');
        const kycBtn = document.getElementById('verifyKycBtn');
        const submitBtn = document.getElementById('submitBidBtn');
        const bidNotice = document.getElementById('bidNotice');

        kycStatus.textContent = '체험 준비 중...';
        kycBtn.disabled = true;

        setTimeout(() => {
            this.isKYCVerified = true;
            kycStatus.textContent = '체험 가능';
            kycStatus.classList.add('verified');
            kycBtn.style.display = 'none';
            submitBtn.disabled = false;
            bidNotice.textContent = '입찰 준비 완료';
            bidNotice.style.color = 'var(--accent)';

            console.log('[App] Demo participation enabled (no real KYC)');
        }, 1500);
    }

    async submitBid() {
        if (this.submitting || this.resolving) return;
        if (!this.isKYCVerified) {
            alert('먼저 체험 시작 버튼을 눌러주세요.');
            return;
        }

        if (!this.currentLot) {
            alert('작품을 선택해주세요.');
            return;
        }

        const input = document.getElementById('bidAmount');
        const amount = Number(input.value);

        if (!Number.isSafeInteger(amount) || amount < this.currentLot.startingBid || amount > 2147483647) {
            alert(`최소 입찰가는 ${this.formatCurrency(this.currentLot.startingBid)}입니다.`);
            return;
        }

        this.submitting = true;
        const lotId = this.currentLot.id;
        try {
        const bid = await cryptoEngine.createBid(amount, this.currentUserId);
        this.bids.get(lotId).push(bid);

        // Update UI
        this.renderLotList();
        this.updateStats();
        this.updateSelectedLotStats();

        // Reset form
        input.value = '';
        document.getElementById('previewCode').textContent = '금액을 입력하면 기록 해시가 표시됩니다';

        // Reset flow animation
        document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('active', 'complete'));

        alert('체험 입찰을 기록했습니다. 승자 확인 시 FHE16으로 비교합니다.');
        console.log('[App] Bid submitted');
        } catch (error) { alert(error.message); }
        finally { this.submitting = false; }
    }

    async animateFHEFlow() {
        const steps = document.querySelectorAll('.flow-step');

        // Step 1: Encrypt
        steps[0].classList.add('active');
        await this.delay(600);
        steps[0].classList.remove('active');
        steps[0].classList.add('complete');

        // Step 2: Sealed
        steps[1].classList.add('active');
        await this.delay(500);
        steps[1].classList.remove('active');
        steps[1].classList.add('complete');

        // Step 3: Complete
        steps[2].classList.add('active');
        await this.delay(400);
        steps[2].classList.remove('active');
        steps[2].classList.add('complete');
    }

    async determineWinner() {
        if (this.resolving || this.submitting) return;
        if (!this.currentLot) {
            alert('작품을 선택해주세요.');
            return;
        }

        const bids = this.bids.get(this.currentLot.id);
        if (bids.length === 0) {
            alert('아직 입찰이 없습니다.');
            return;
        }

        this.resolving = true;
        const button = document.getElementById('determineWinnerBtn');
        const lotId = this.currentLot.id;
        button.disabled = true;
        button.textContent = 'SDK에서 FHE16 비교 중…';
        try {

        // Animate FHE flow
        const steps = document.querySelectorAll('.flow-step');
        steps.forEach(s => s.classList.remove('active', 'complete'));

        steps[0].classList.add('active');
        await this.delay(800);
        steps[0].classList.add('complete');
        steps[0].classList.remove('active');

        steps[1].classList.add('active');
        const winnerData = await cryptoEngine.computeWinner(bids);
        await this.delay(800);
        steps[1].classList.add('complete');
        steps[1].classList.remove('active');

        steps[2].classList.add('active');
        await this.delay(600);
        steps[2].classList.add('complete');
        steps[2].classList.remove('active');

        if (this.currentLot.id === lotId) this.showWinnerModal(winnerData);
        button.dataset.status = 'passed';
        } catch (error) {
            button.dataset.status = 'failed';
            document.querySelectorAll('.flow-step').forEach(step => step.classList.remove('active', 'complete'));
            alert('FHE16 비교를 완료하지 못했습니다. 승자를 확정하지 않았습니다. ' + error.message);
        } finally {
            this.resolving = false;
            button.disabled = false;
            button.textContent = 'SDK로 승자 확인';
        }
    }

    showWinnerModal(winnerData) {
        const modal = document.getElementById('winnerModal');
        const title = document.getElementById('winnerTitle');
        const details = document.getElementById('winnerDetails');

        const isCurrentUser = winnerData.winnerId === this.currentUserId;
        title.textContent = isCurrentUser ? '축하합니다! 낙찰되셨습니다!' : '낙찰 결과';

        const fee = Math.round(winnerData.winningAmount * 0.18);
        const total = winnerData.winningAmount + fee;

        details.innerHTML = `
            <div class="winner-info">
                <div class="info-row">
                    <span class="label">작품</span>
                    <span class="value">${this.currentLot.title}</span>
                </div>
                <div class="info-row">
                    <span class="label">낙찰자</span>
                    <span class="value">${isCurrentUser ? '본인' : winnerData.winnerId.substring(0, 12) + '...'}</span>
                </div>
                <div class="info-row">
                    <span class="label">낙찰가</span>
                    <span class="value highlight">${this.formatCurrency(winnerData.winningAmount)}</span>
                </div>
                <div class="info-row">
                    <span class="label">구매자 수수료 (18%)</span>
                    <span class="value">${this.formatCurrency(fee)}</span>
                </div>
                <div class="info-row total">
                    <span class="label">총 결제 금액</span>
                    <span class="value">${this.formatCurrency(total)}</span>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    async showEncryptedData() {
        if (!this.currentLot) {
            alert('작품을 선택해주세요.');
            return;
        }

        const modal = document.getElementById('encryptedDataModal');
        const content = document.getElementById('encryptedDataContent');
        const bids = this.bids.get(this.currentLot.id) || [];

        content.innerHTML = `
            <div class="encrypted-section">
                <h4>입찰 기록 해시 (${bids.length}건)</h4>
                <p class="section-desc">아래 문자열은 SHA-256 기록 해시입니다. 암호문이 아니며, 이 체험의 원금액은 브라우저 메모리에서 처리합니다.</p>
                <div class="encrypted-list">
                    ${bids.map((bid, i) => `
                        <div class="encrypted-item">
                            <div class="item-header">
                                <span class="bid-index">입찰 #${i + 1}</span>
                                <span class="bid-time">${new Date(bid.timestamp).toLocaleString('ko-KR')}</span>
                            </div>
                            <div class="encrypted-value">
                                <code>${cryptoEngine.formatForDisplay(bid.commitment, 80)}</code>
                            </div>
                            <div class="commitment">
                                <span class="label">커밋먼트: </span>
                                <code>${bid.id}</code>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="encrypted-section">
                <h4>SDK 실행 정보</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">알고리즘</span>
                        <span class="value">SELLAN SDK · FHE16 진단</span>
                    </div>
                    <div class="info-item">
                        <span class="label">실행 환경</span>
                        <span class="value">SDK가 Worker·키 생성 관리</span>
                    </div>
                    <div class="info-item">
                        <span class="label">연산 방식</span>
                        <span class="value">원 단위 FHE MAX · ${cryptoEngine.lastCompute?.comparisons ?? 0}회 비교</span>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    updateStats() {
        document.getElementById('totalLots').textContent = this.lots.length;
        document.getElementById('activeAuctions').textContent = this.lots.filter(l => l.status === 'active').length;

        let totalBids = 0;
        let myBids = 0;
        this.bids.forEach(bids => {
            totalBids += bids.length;
            myBids += bids.filter(b => b.bidderId === this.currentUserId).length;
        });

        document.getElementById('totalBids').textContent = totalBids;
        document.getElementById('yourBids').textContent = myBids;

        this.updateRecentBids();
    }

    updateSelectedLotStats() {
        if (!this.currentLot) return;

        const statsSection = document.getElementById('selectedLotStats');
        statsSection.style.display = 'block';

        document.getElementById('selectedLotTitle').textContent = this.currentLot.title.substring(0, 25) + '...';

        const bids = this.bids.get(this.currentLot.id) || [];
        document.getElementById('lotBidCount').textContent = bids.length;
    }

    updateRecentBids() {
        const container = document.getElementById('recentBidsList');
        if (!container) return;

        const allBids = [];
        this.bids.forEach((bids, lotId) => {
            const lot = this.lots.find(l => l.id === lotId);
            bids.forEach(bid => allBids.push({ ...bid, lot }));
        });

        allBids.sort((a, b) => b.timestamp - a.timestamp);
        const recent = allBids.slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-message">아직 입찰이 없습니다</div>';
            return;
        }

        container.innerHTML = recent.map(bid => `
            <div class="recent-bid-item">
                <div class="bid-lot">${bid.lot?.title?.substring(0, 20) || 'Unknown'}...</div>
                <div class="bid-info">
                    <span>${bid.bidderId === this.currentUserId ? '본인' : bid.bidderId.substring(0, 8) + '...'}</span>
                    <span>${this.formatTime(bid.timestamp)}</span>
                </div>
                <div class="bid-status">체험 기록</div>
            </div>
        `).join('');
    }

    formatCurrency(amount) {
        return `${amount.toLocaleString('ko-KR')}원`;
    }

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return '방금 전';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
        return new Date(timestamp).toLocaleDateString('ko-KR');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new AuctionApp();
    window.app = app;
    try { await app.initialize(); }
    catch (error) { console.error('[App] SDK initialization failed'); alert('SDK 체험을 시작하지 못했습니다. ' + error.message); }
});
