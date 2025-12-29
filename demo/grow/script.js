// ========================================
// AgriBlind Demo - Blind Auction + ProofPack
// ========================================

// Crypto utilities (AES-256-GCM simulation)
const crypto = {
    async generateKey() {
        return await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    },

    async encrypt(key, data) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );
        return {
            iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
            ciphertext: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
        };
    },

    async decrypt(key, encrypted) {
        const iv = new Uint8Array(encrypted.iv.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        const ciphertext = new Uint8Array(encrypted.ciphertext.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        return JSON.parse(new TextDecoder().decode(decrypted));
    },

    sha256(str) {
        const encoder = new TextEncoder();
        return window.crypto.subtle.digest('SHA-256', encoder.encode(str))
            .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));
    }
};

// IndexedDB for ProofPack storage
const db = {
    name: 'AgriBlindDB',
    version: 1,
    instance: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.instance = request.result;
                resolve(this.instance);
            };
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains('auctions')) {
                    database.createObjectStore('auctions', { keyPath: 'auctionId' });
                }
                if (!database.objectStoreNames.contains('bids')) {
                    const bidStore = database.createObjectStore('bids', { keyPath: 'bidId' });
                    bidStore.createIndex('auctionId', 'auctionId', { unique: false });
                }
                if (!database.objectStoreNames.contains('proofpacks')) {
                    database.createObjectStore('proofpacks', { keyPath: 'auctionId' });
                }
            };
        });
    },

    async save(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.instance.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.instance.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    async clear() {
        const stores = ['auctions', 'bids', 'proofpacks'];
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const tx = this.instance.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }
    }
};

// Bidder data (real identities - hidden until reveal)
const realBidders = [
    { id: 1, token: 'ANON-7X9K', realName: '김대영 (중도매인 A-1234)', company: '영주청과', license: '제2023-1234호' },
    { id: 2, token: 'ANON-3M2P', realName: '박상호 (중도매인 B-5678)', company: '서울농산', license: '제2023-5678호' },
    { id: 3, token: 'ANON-8Q5R', realName: '이준혁 (중도매인 C-9012)', company: '대전과일', license: '제2023-9012호' },
    { id: 4, token: 'ANON-1Y6T', realName: '최민수 (중도매인 D-3456)', company: '부산농수산', license: '제2023-3456호' },
    { id: 5, token: 'ANON-4W8N', realName: '정우성 (중도매인 E-7890)', company: '인천신선', license: '제2023-7890호' }
];

// Auction state
let state = {
    auctionId: null,
    status: 'waiting', // waiting, bidding, completed
    encryptionKey: null,
    startPrice: 50000,
    currentHighBid: 0,
    currentHighBidder: null,
    bids: [],
    hashChain: [],
    proofPack: null,
    winnerId: null
};

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatKRW(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Initialize demo
async function initDemo() {
    await db.init();
    state.encryptionKey = await crypto.generateKey();
    state.auctionId = 'AUC-' + generateId().toUpperCase();
    console.log('AgriBlind Demo initialized');
}

// Reset demo
async function resetDemo() {
    await db.clear();

    state = {
        auctionId: 'AUC-' + generateId().toUpperCase(),
        status: 'waiting',
        encryptionKey: await crypto.generateKey(),
        startPrice: 50000,
        currentHighBid: 0,
        currentHighBidder: null,
        bids: [],
        hashChain: [],
        proofPack: null,
        winnerId: null
    };

    // Reset UI
    document.getElementById('lotStatus').textContent = '경매 대기';
    document.getElementById('lotStatus').className = 'lot-status';
    document.getElementById('currentBid').textContent = '-';
    document.getElementById('currentBidder').textContent = '응찰 대기 중';
    document.getElementById('currentBidBox').className = 'current-bid-box';
    document.getElementById('bidLog').innerHTML = '<p class="log-placeholder">경매 시작 후 응찰 내역이 기록됩니다</p>';
    document.getElementById('winnerSection').style.display = 'none';
    document.getElementById('proofPack').innerHTML = '<p class="proof-placeholder">경매 완료 후 증빙이 생성됩니다</p>';
    document.getElementById('challengeBox').innerHTML = '<p class="challenge-placeholder">낙찰 확정 후 이의제기 가능</p>';
    document.getElementById('verificationResult').innerHTML = '<p class="verify-placeholder">경매 후 검증 가능</p>';
    document.getElementById('realBidderBox').innerHTML = '<p class="bidder-placeholder">경매 완료 후 매핑 가능</p>';
    document.getElementById('verifyBtn').disabled = true;
    document.getElementById('startAuctionBtn').disabled = false;
    document.getElementById('startAuctionBtn').innerHTML = '<span class="btn-icon">🔔</span> 경매 시작';

    // Reset bidder status
    document.querySelectorAll('.bidder-card').forEach(card => {
        const status = card.querySelector('.bidder-status');
        status.textContent = '대기';
        status.className = 'bidder-status pending';
    });

    // Reset stats
    document.getElementById('statManipulation').textContent = '-';
    document.getElementById('statDispute').textContent = '-';
    document.getElementById('statProof').textContent = '-';
    document.getElementById('statTransparency').textContent = '-';

    console.log('Demo reset. New auction ID:', state.auctionId);
}

// Start auction
async function startAuction() {
    if (state.status !== 'waiting') return;

    state.status = 'bidding';

    // Update UI
    document.getElementById('lotStatus').textContent = '경매 중';
    document.getElementById('lotStatus').classList.add('active');
    document.getElementById('startAuctionBtn').disabled = true;
    document.getElementById('startAuctionBtn').innerHTML = '<span class="btn-icon">⏳</span> 경매 진행 중...';
    document.getElementById('bidLog').innerHTML = '';

    // Record auction start
    const auctionStart = {
        auctionId: state.auctionId,
        lot: '사과 (부사) 10kg',
        startPrice: state.startPrice,
        startTime: new Date().toISOString(),
        bidderCount: realBidders.length
    };

    await db.save('auctions', auctionStart);

    // Create initial hash (genesis)
    const genesisData = JSON.stringify(auctionStart);
    const genesisHash = await crypto.sha256(genesisData);
    state.hashChain.push({
        index: 0,
        type: 'AUCTION_START',
        data: auctionStart,
        hash: genesisHash,
        prevHash: '0'.repeat(64)
    });

    addLogEntry('시스템', '경매 시작', `LOT: 사과 부사 10kg | 시작가: ${formatKRW(state.startPrice)}`, 'system');

    // Start simulated bidding
    await simulateBidding();
}

// Simulate bidding process
async function simulateBidding() {
    const bidAmounts = [51000, 52500, 53000, 54500, 55000, 56000, 56500, 57000];
    const shuffledBidders = [...realBidders].sort(() => Math.random() - 0.5);

    let bidIndex = 0;

    for (const amount of bidAmounts) {
        if (bidIndex >= shuffledBidders.length * 2) break;

        const bidder = shuffledBidders[bidIndex % shuffledBidders.length];

        // Random delay between bids (500-1500ms)
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        await placeBid(bidder, amount);
        bidIndex++;
    }

    // Complete auction
    await completeAuction();
}

// Place a bid (with encryption)
async function placeBid(bidder, amount) {
    if (amount <= state.currentHighBid) return;

    const bidData = {
        bidId: 'BID-' + generateId().toUpperCase(),
        auctionId: state.auctionId,
        bidderToken: bidder.token,
        amount: amount,
        timestamp: new Date().toISOString()
    };

    // Encrypt bid data
    const encryptedBid = await crypto.encrypt(state.encryptionKey, bidData);

    // Calculate hash for chain
    const prevHash = state.hashChain[state.hashChain.length - 1].hash;
    const bidHash = await crypto.sha256(JSON.stringify(bidData) + prevHash);

    state.hashChain.push({
        index: state.hashChain.length,
        type: 'BID',
        data: bidData,
        encryptedData: encryptedBid,
        hash: bidHash,
        prevHash: prevHash
    });

    // Store encrypted bid
    state.bids.push({
        ...bidData,
        encrypted: encryptedBid
    });

    // Update state
    state.currentHighBid = amount;
    state.currentHighBidder = bidder;
    state.winnerId = bidder.id;

    // Save to DB
    await db.save('bids', {
        ...bidData,
        encrypted: encryptedBid,
        chainHash: bidHash
    });

    // Update UI
    updateBidDisplay(bidder.token, amount);
    updateBidderStatus(bidder.id, 'active');
    addLogEntry(bidder.token, formatKRW(amount), `해시: ${bidHash.substring(0, 16)}...`, 'bid');
}

// Update bid display
function updateBidDisplay(token, amount) {
    const bidBox = document.getElementById('currentBidBox');
    bidBox.classList.add('highlight');

    document.getElementById('currentBid').textContent = formatKRW(amount);
    document.getElementById('currentBidder').textContent = `🔒 ${token}`;

    setTimeout(() => bidBox.classList.remove('highlight'), 300);
}

// Update bidder status
function updateBidderStatus(bidderId, status) {
    const card = document.querySelector(`[data-bidder="${bidderId}"]`);
    if (card) {
        const statusEl = card.querySelector('.bidder-status');
        if (status === 'active') {
            statusEl.textContent = '응찰';
            statusEl.className = 'bidder-status active';
        } else if (status === 'winner') {
            statusEl.textContent = '낙찰';
            statusEl.className = 'bidder-status winner';
        }
    }
}

// Add log entry
function addLogEntry(actor, action, detail, type) {
    const log = document.getElementById('bidLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <span class="log-time">${formatTime(new Date())}</span>
        <span class="log-actor">${actor}</span>
        <span class="log-action">${action}</span>
        <span class="log-detail">${detail}</span>
    `;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Complete auction
async function completeAuction() {
    state.status = 'completed';

    // Record auction end
    const endData = {
        type: 'AUCTION_END',
        auctionId: state.auctionId,
        winnerToken: state.currentHighBidder.token,
        finalAmount: state.currentHighBid,
        endTime: new Date().toISOString(),
        totalBids: state.bids.length
    };

    const prevHash = state.hashChain[state.hashChain.length - 1].hash;
    const endHash = await crypto.sha256(JSON.stringify(endData) + prevHash);

    state.hashChain.push({
        index: state.hashChain.length,
        type: 'AUCTION_END',
        data: endData,
        hash: endHash,
        prevHash: prevHash
    });

    // Calculate merkle root
    const merkleRoot = await calculateMerkleRoot(state.hashChain.map(h => h.hash));

    // Generate ProofPack
    state.proofPack = {
        version: '1.0',
        auctionId: state.auctionId,
        lot: '사과 (부사) 10kg',
        startPrice: state.startPrice,
        finalPrice: state.currentHighBid,
        winnerToken: state.currentHighBidder.token,
        bidCount: state.bids.length,
        startTime: state.hashChain[0].data.startTime,
        endTime: endData.endTime,
        merkleRoot: merkleRoot,
        hashChainLength: state.hashChain.length,
        genesisHash: state.hashChain[0].hash,
        finalHash: endHash,
        algorithm: 'SHA-256 + AES-256-GCM',
        generatedAt: new Date().toISOString()
    };

    // Save ProofPack
    await db.save('proofpacks', state.proofPack);

    // Update UI
    document.getElementById('lotStatus').textContent = '낙찰 완료';
    document.getElementById('lotStatus').className = 'lot-status completed';
    document.getElementById('startAuctionBtn').innerHTML = '<span class="btn-icon">✓</span> 경매 완료';

    updateBidderStatus(state.winnerId, 'winner');
    addLogEntry('시스템', '경매 종료', `낙찰가: ${formatKRW(state.currentHighBid)} | 총 ${state.bids.length}건 응찰`, 'system');

    // Show winner
    showWinner();

    // Display ProofPack
    displayProofPack();

    // Enable verification
    document.getElementById('verifyBtn').disabled = false;

    // Show challenge option
    showChallengeOption();

    // Show reveal button
    showRevealButton();

    // Update stats
    updateStats();
}

// Calculate Merkle root
async function calculateMerkleRoot(hashes) {
    if (hashes.length === 0) return '0'.repeat(64);
    if (hashes.length === 1) return hashes[0];

    const pairs = [];
    for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        pairs.push(await crypto.sha256(left + right));
    }

    return calculateMerkleRoot(pairs);
}

// Show winner
function showWinner() {
    const winnerSection = document.getElementById('winnerSection');
    const winnerBox = document.getElementById('winnerBox');

    winnerSection.style.display = 'block';
    winnerBox.innerHTML = `
        <div class="winner-info">
            <div class="winner-token">🏆 ${state.currentHighBidder.token}</div>
            <div class="winner-price">${formatKRW(state.currentHighBid)}</div>
            <div class="winner-note">
                ※ 실제 응찰자 정보는 낙찰 확정 후 관리자에게만 공개됩니다
            </div>
        </div>
    `;
}

// Display ProofPack
function displayProofPack() {
    const proofEl = document.getElementById('proofPack');
    proofEl.innerHTML = `
        <div class="proof-content">
            <div class="proof-header">
                <span class="proof-id">${state.proofPack.auctionId}</span>
                <span class="proof-time">${new Date(state.proofPack.generatedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div class="proof-grid">
                <div class="proof-item">
                    <span class="proof-label">LOT</span>
                    <span class="proof-value">${state.proofPack.lot}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">낙찰가</span>
                    <span class="proof-value">${formatKRW(state.proofPack.finalPrice)}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">응찰 건수</span>
                    <span class="proof-value">${state.proofPack.bidCount}건</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">해시 체인</span>
                    <span class="proof-value">${state.proofPack.hashChainLength}블록</span>
                </div>
            </div>
            <div class="proof-hashes">
                <div class="hash-item">
                    <span class="hash-label">Merkle Root</span>
                    <code class="hash-value">${state.proofPack.merkleRoot.substring(0, 32)}...</code>
                </div>
                <div class="hash-item">
                    <span class="hash-label">Final Hash</span>
                    <code class="hash-value">${state.proofPack.finalHash.substring(0, 32)}...</code>
                </div>
            </div>
            <div class="proof-footer">
                <span class="proof-algo">🔐 ${state.proofPack.algorithm}</span>
                <button class="btn btn-sm btn-outline" onclick="downloadProofPack()">
                    📥 다운로드
                </button>
            </div>
        </div>
    `;
}

// Download ProofPack as JSON
function downloadProofPack() {
    const fullProofPack = {
        ...state.proofPack,
        hashChain: state.hashChain.map(h => ({
            index: h.index,
            type: h.type,
            hash: h.hash,
            prevHash: h.prevHash,
            timestamp: h.data.timestamp || h.data.startTime || h.data.endTime
        })),
        encryptedBids: state.bids.map(b => ({
            bidId: b.bidId,
            encrypted: b.encrypted,
            chainHash: state.hashChain.find(h => h.type === 'BID' && h.data.bidId === b.bidId)?.hash
        }))
    };

    const blob = new Blob([JSON.stringify(fullProofPack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProofPack_${state.auctionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Show challenge option
function showChallengeOption() {
    const challengeBox = document.getElementById('challengeBox');
    challengeBox.innerHTML = `
        <div class="challenge-content">
            <p class="challenge-info">
                📋 낙찰 결과에 이의가 있는 경우 <strong>7일 이내</strong> 이의제기 가능
            </p>
            <div class="challenge-buttons">
                <button class="btn btn-challenge" onclick="openChallengeModal()">
                    ⚖️ 이의제기 시뮬레이션
                </button>
            </div>
            <p class="challenge-note">
                ※ 이의제기 시 무작위 샘플링으로 해시 체인 검증
            </p>
        </div>
    `;
}

// Open challenge modal
function openChallengeModal() {
    const modal = document.getElementById('challengeModal');
    const body = document.getElementById('challengeModalBody');

    // Random sampling: select 3 random blocks to verify
    const sampleSize = Math.min(3, state.hashChain.length);
    const indices = [];
    while (indices.length < sampleSize) {
        const idx = Math.floor(Math.random() * state.hashChain.length);
        if (!indices.includes(idx)) indices.push(idx);
    }
    indices.sort((a, b) => a - b);

    const sampledBlocks = indices.map(i => state.hashChain[i]);

    body.innerHTML = `
        <div class="challenge-modal-content">
            <div class="challenge-header">
                <h4>🎲 무작위 샘플링 검증</h4>
                <p>해시 체인 ${state.hashChain.length}개 블록 중 ${sampleSize}개를 무작위 선택하여 검증합니다.</p>
            </div>

            <div class="sampled-blocks">
                ${sampledBlocks.map((block, i) => `
                    <div class="sampled-block">
                        <div class="block-header">
                            <span class="block-index">Block #${block.index}</span>
                            <span class="block-type">${block.type}</span>
                        </div>
                        <div class="block-body">
                            <div class="block-hash">
                                <span class="label">현재 해시:</span>
                                <code>${block.hash.substring(0, 48)}...</code>
                            </div>
                            <div class="block-prev">
                                <span class="label">이전 해시:</span>
                                <code>${block.prevHash.substring(0, 48)}...</code>
                            </div>
                        </div>
                        <div class="block-status verifying" id="blockStatus${i}">
                            🔄 검증 중...
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="challenge-actions">
                <button class="btn btn-primary" onclick="runChallenge(${JSON.stringify(indices).replace(/"/g, "'")})">
                    🔍 검증 실행
                </button>
            </div>

            <div class="challenge-result" id="challengeResult"></div>
        </div>
    `;

    modal.classList.add('active');
}

// Run challenge verification
async function runChallenge(indices) {
    let allValid = true;

    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        const block = state.hashChain[idx];
        const statusEl = document.getElementById(`blockStatus${i}`);

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify hash chain integrity
        let isValid = true;
        if (idx > 0) {
            const prevBlock = state.hashChain[idx - 1];
            isValid = block.prevHash === prevBlock.hash;
        }

        // Also verify hash computation
        const recomputedHash = await crypto.sha256(
            JSON.stringify(block.data) + block.prevHash
        );
        isValid = isValid && (recomputedHash === block.hash);

        if (isValid) {
            statusEl.className = 'block-status verified';
            statusEl.textContent = '✓ 검증 완료 - 무결성 확인';
        } else {
            statusEl.className = 'block-status failed';
            statusEl.textContent = '✗ 검증 실패 - 변조 감지';
            allValid = false;
        }
    }

    // Show final result
    const resultEl = document.getElementById('challengeResult');
    if (allValid) {
        resultEl.innerHTML = `
            <div class="result-success">
                <span class="result-icon">✅</span>
                <div class="result-text">
                    <h5>검증 성공</h5>
                    <p>샘플링된 모든 블록의 무결성이 확인되었습니다.</p>
                    <p class="result-note">→ 이의제기 기각: 경매 결과 유효</p>
                </div>
            </div>
        `;
    } else {
        resultEl.innerHTML = `
            <div class="result-failure">
                <span class="result-icon">⚠️</span>
                <div class="result-text">
                    <h5>검증 실패</h5>
                    <p>해시 체인 변조가 감지되었습니다.</p>
                    <p class="result-note">→ 이의제기 승인: 추가 조사 필요</p>
                </div>
            </div>
        `;
    }
}

// Close challenge modal
function closeChallengeModal() {
    document.getElementById('challengeModal').classList.remove('active');
}

// Show reveal button
function showRevealButton() {
    const revealBox = document.getElementById('realBidderBox');
    revealBox.innerHTML = `
        <div class="reveal-content">
            <p class="reveal-info">
                🔐 낙찰 확정 후 관리자/감사위원만 열람 가능
            </p>
            <button class="btn btn-reveal" onclick="openRevealModal()">
                🔓 응찰자 ID 매핑 확인
            </button>
        </div>
    `;
}

// Open reveal modal
function openRevealModal() {
    const modal = document.getElementById('revealModal');
    const body = document.getElementById('revealModalBody');

    body.innerHTML = `
        <div class="reveal-modal-content">
            <div class="reveal-warning">
                ⚠️ 이 정보는 감사/분쟁조정 목적으로만 열람해야 합니다.
            </div>

            <div class="id-mapping-list">
                ${realBidders.map(bidder => {
                    const bid = state.bids.find(b => b.bidderToken === bidder.token);
                    const isWinner = bidder.id === state.winnerId;
                    return `
                        <div class="id-mapping-item ${isWinner ? 'winner' : ''}">
                            <div class="mapping-token">
                                <span class="token-badge">🔒</span>
                                <span class="token-value">${bidder.token}</span>
                                ${isWinner ? '<span class="winner-badge">🏆 낙찰자</span>' : ''}
                            </div>
                            <div class="mapping-arrow">→</div>
                            <div class="mapping-real">
                                <div class="real-name">${bidder.realName}</div>
                                <div class="real-company">${bidder.company}</div>
                                <div class="real-license">${bidder.license}</div>
                            </div>
                            ${bid ? `<div class="mapping-bid">최종응찰: ${formatKRW(bid.amount)}</div>` : '<div class="mapping-bid">응찰 없음</div>'}
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="reveal-footer">
                <p>※ 열람 기록은 감사 로그에 저장됩니다.</p>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Close reveal modal
function closeRevealModal() {
    document.getElementById('revealModal').classList.remove('active');
}

// Verify ProofPack
async function verifyResult() {
    const resultEl = document.getElementById('verificationResult');
    resultEl.innerHTML = '<p class="verifying">🔄 검증 중...</p>';

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify hash chain
    let chainValid = true;
    for (let i = 1; i < state.hashChain.length; i++) {
        if (state.hashChain[i].prevHash !== state.hashChain[i - 1].hash) {
            chainValid = false;
            break;
        }
    }

    // Verify merkle root
    const calculatedMerkle = await calculateMerkleRoot(state.hashChain.map(h => h.hash));
    const merkleValid = calculatedMerkle === state.proofPack.merkleRoot;

    // Verify final hash
    const finalBlock = state.hashChain[state.hashChain.length - 1];
    const recalculatedFinal = await crypto.sha256(JSON.stringify(finalBlock.data) + finalBlock.prevHash);
    const finalValid = recalculatedFinal === state.proofPack.finalHash;

    const allValid = chainValid && merkleValid && finalValid;

    resultEl.innerHTML = `
        <div class="verify-results ${allValid ? 'success' : 'failure'}">
            <div class="verify-item ${chainValid ? 'pass' : 'fail'}">
                <span class="verify-icon">${chainValid ? '✓' : '✗'}</span>
                <span class="verify-label">해시 체인 무결성</span>
            </div>
            <div class="verify-item ${merkleValid ? 'pass' : 'fail'}">
                <span class="verify-icon">${merkleValid ? '✓' : '✗'}</span>
                <span class="verify-label">Merkle Root 일치</span>
            </div>
            <div class="verify-item ${finalValid ? 'pass' : 'fail'}">
                <span class="verify-icon">${finalValid ? '✓' : '✗'}</span>
                <span class="verify-label">최종 해시 유효</span>
            </div>
            <div class="verify-summary">
                ${allValid
                    ? '✅ 모든 검증 통과 - ProofPack 유효'
                    : '⚠️ 검증 실패 - 데이터 변조 의심'}
            </div>
        </div>
    `;
}

// Update stats
function updateStats() {
    document.getElementById('statManipulation').textContent = '0%';
    document.getElementById('statManipulation').classList.add('positive');

    document.getElementById('statDispute').textContent = '자동화';
    document.getElementById('statDispute').classList.add('positive');

    document.getElementById('statProof').textContent = '즉시';
    document.getElementById('statProof').classList.add('positive');

    document.getElementById('statTransparency').textContent = '100%';
    document.getElementById('statTransparency').classList.add('positive');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initDemo);

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
