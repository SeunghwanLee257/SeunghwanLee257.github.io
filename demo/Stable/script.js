// ========================================
// IRONVEIL Vault Demo - Stablecoin Privacy Infrastructure
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

    async sha256(str) {
        const encoder = new TextEncoder();
        const hash = await window.crypto.subtle.digest('SHA-256', encoder.encode(str));
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
};

// Institution data
const institutions = [
    { id: 'SEC_A', name: '한국증권', type: '증권사', icon: '📈', balance: 5000000000 },
    { id: 'SEC_B', name: '미래투자', type: '증권사', icon: '📊', balance: 3500000000 },
    { id: 'BANK_A', name: '국민은행', type: '은행', icon: '🏦', balance: 10000000000 },
    { id: 'GOV_A', name: '서울시', type: '지자체', icon: '🏛️', balance: 2000000000 },
    { id: 'CORP_A', name: '삼성전자', type: '기업', icon: '🏢', balance: 8000000000 }
];

// GovSplit KMS nodes
const kmsNodes = [
    { id: 'node_1', name: '금융위', icon: '🏛️', type: '감독기관' },
    { id: 'node_2', name: '한국은행', icon: '🏦', type: '중앙은행' },
    { id: 'node_3', name: '코스콤', icon: '🖥️', type: '인프라' },
    { id: 'node_4', name: '예탁결제원', icon: '📋', type: '결제기관' },
    { id: 'node_5', name: '감사위원', icon: '⚖️', type: '감사' },
    { id: 'node_6', name: '옴부즈만', icon: '👤', type: '분쟁조정' }
];

// Application state
let state = {
    encryptionKey: null,
    accounts: [],
    transactions: [],
    hashChain: [],
    settlements: [],
    approvalState: {
        active: false,
        targetAccount: null,
        reason: null,
        approvedNodes: []
    }
};

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format currency
function formatKRW(amount) {
    if (amount >= 100000000) {
        return (amount / 100000000).toFixed(1) + '억원';
    } else if (amount >= 10000) {
        return (amount / 10000).toFixed(0) + '만원';
    }
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

function formatKRWFull(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Initialize demo
async function initDemo() {
    state.encryptionKey = await crypto.generateKey();

    // Initialize accounts with encrypted balances
    for (const inst of institutions) {
        const encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: inst.balance });
        state.accounts.push({
            ...inst,
            encryptedBalance,
            plainBalance: inst.balance // For demo purposes, we keep track
        });
    }

    // Create genesis block
    const genesisData = {
        type: 'GENESIS',
        timestamp: new Date().toISOString(),
        accounts: state.accounts.map(a => a.id)
    };
    const genesisHash = await crypto.sha256(JSON.stringify(genesisData));
    state.hashChain.push({
        index: 0,
        type: 'GENESIS',
        data: genesisData,
        hash: genesisHash,
        prevHash: '0'.repeat(64)
    });

    renderAccounts();
    renderNodes();
    populateSelects();
    updateStats();

    console.log('IRONVEIL Vault Demo initialized');
}

// Reset demo
async function resetDemo() {
    state = {
        encryptionKey: await crypto.generateKey(),
        accounts: [],
        transactions: [],
        hashChain: [],
        settlements: [],
        approvalState: {
            active: false,
            targetAccount: null,
            reason: null,
            approvedNodes: []
        }
    };

    await initDemo();

    // Reset UI
    document.getElementById('transactionLog').innerHTML = '<div class="log-empty">거래를 실행하면 암호화된 로그가 기록됩니다</div>';
    document.getElementById('logCount').textContent = '0건';
    document.getElementById('disclosureResult').style.display = 'none';
    document.getElementById('settlementPreview').innerHTML = '<div class="preview-placeholder">거래 내역이 쌓이면 정산 미리보기가 표시됩니다</div>';
    document.getElementById('settlementBtn').disabled = true;
    document.getElementById('verifyBtn').disabled = true;

    // Reset nodes
    document.querySelectorAll('.node-card').forEach(node => {
        node.classList.remove('approving', 'approved');
        node.querySelector('.node-status').textContent = '대기';
        node.querySelector('.node-status').classList.remove('approved');
    });
    document.getElementById('nodesStatus').textContent = '대기 중';
    document.getElementById('nodesStatus').className = 'nodes-status';
}

// Render accounts
function renderAccounts() {
    const container = document.getElementById('accountsList');
    container.innerHTML = '';

    state.accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.dataset.id = account.id;
        card.innerHTML = `
            <div class="account-header">
                <div class="account-avatar">${account.icon}</div>
                <div class="account-info">
                    <div class="account-name">${account.name}</div>
                    <div class="account-type">${account.type}</div>
                </div>
                <div class="account-badge">${account.id}</div>
            </div>
            <div class="account-balance">
                <div class="balance-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    FHE16 암호화 잔고
                </div>
                <div class="balance-value">${formatKRW(account.plainBalance)}</div>
                <div class="balance-encrypted">${account.encryptedBalance.ciphertext.substring(0, 40)}...</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render KMS nodes
function renderNodes() {
    const container = document.getElementById('nodesGrid');
    container.innerHTML = '';

    kmsNodes.forEach(node => {
        const card = document.createElement('div');
        card.className = 'node-card';
        card.dataset.id = node.id;
        card.innerHTML = `
            <div class="node-icon">${node.icon}</div>
            <div class="node-name">${node.name}</div>
            <div class="node-status">대기</div>
        `;
        container.appendChild(card);
    });
}

// Populate select dropdowns
function populateSelects() {
    const fromSelect = document.getElementById('fromAccount');
    const toSelect = document.getElementById('toAccount');
    const disclosureSelect = document.getElementById('disclosureTarget');

    [fromSelect, toSelect, disclosureSelect].forEach(select => {
        select.innerHTML = '<option value="">선택하세요</option>';
        state.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.icon} ${account.name} (${account.type})`;
            select.appendChild(option);
        });
    });
}

// Update statistics
function updateStats() {
    document.getElementById('chainLength').textContent = `${state.hashChain.length} 블록`;

    if (state.hashChain.length > 0) {
        const lastHash = state.hashChain[state.hashChain.length - 1].hash;
        document.getElementById('merkleRoot').textContent = lastHash.substring(0, 24) + '...';
    }

    if (state.transactions.length > 0) {
        document.getElementById('verifyBtn').disabled = false;
    }
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Tab');
    });
}

// Set quick amount
function setAmount(amount) {
    document.getElementById('transferAmount').value = amount.toLocaleString();
}

// Execute transfer
async function executeTransfer() {
    const fromId = document.getElementById('fromAccount').value;
    const toId = document.getElementById('toAccount').value;
    const amountStr = document.getElementById('transferAmount').value.replace(/,/g, '');
    const amount = parseInt(amountStr);

    if (!fromId || !toId || !amount) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (fromId === toId) {
        alert('출금 계정과 입금 계정이 같습니다.');
        return;
    }

    const fromAccount = state.accounts.find(a => a.id === fromId);
    const toAccount = state.accounts.find(a => a.id === toId);

    if (fromAccount.plainBalance < amount) {
        alert('잔고가 부족합니다.');
        return;
    }

    // Show processing modal
    showProcessingModal('FHE16 암호화 송금 처리 중', [
        { text: '거래 데이터 암호화', status: 'active' },
        { text: '잔고 업데이트 (암호문 연산)', status: 'pending' },
        { text: '해시 체인 기록', status: 'pending' },
        { text: '트랜잭션 완료', status: 'pending' }
    ]);

    // Step 1: Encrypt transaction
    await sleep(800);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    // Step 2: Update balances (encrypted)
    fromAccount.plainBalance -= amount;
    toAccount.plainBalance += amount;
    fromAccount.encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: fromAccount.plainBalance });
    toAccount.encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: toAccount.plainBalance });

    await sleep(1000);
    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    // Step 3: Record to hash chain
    const txData = {
        txId: 'TX-' + generateId().toUpperCase(),
        type: 'TRANSFER',
        from: fromId,
        to: toId,
        amount: amount,
        timestamp: new Date().toISOString()
    };

    const encryptedTx = await crypto.encrypt(state.encryptionKey, txData);
    const prevHash = state.hashChain[state.hashChain.length - 1].hash;
    const txHash = await crypto.sha256(JSON.stringify(txData) + prevHash);

    state.hashChain.push({
        index: state.hashChain.length,
        type: 'TRANSFER',
        data: txData,
        encryptedData: encryptedTx,
        hash: txHash,
        prevHash: prevHash
    });

    state.transactions.push({
        ...txData,
        encrypted: encryptedTx,
        chainHash: txHash
    });

    await sleep(600);
    updateProcessingStep(2, 'done');
    updateProcessingStep(3, 'active');

    await sleep(400);
    updateProcessingStep(3, 'done');

    // Close modal and update UI
    await sleep(500);
    hideProcessingModal();

    renderAccounts();
    addTransactionLog(txData, txHash);
    updateStats();
    updateSettlementPreview();

    // Clear form
    document.getElementById('transferAmount').value = '';
}

// Execute settlement
async function executeSettlement() {
    showProcessingModal('암호화 일괄 정산 (Netting) 처리 중', [
        { text: '채권/채무 집계 (암호문)', status: 'active' },
        { text: '순 정산액 계산', status: 'pending' },
        { text: '정산 실행', status: 'pending' },
        { text: '정산 완료', status: 'pending' }
    ]);

    await sleep(1000);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    // Calculate net settlements
    const netAmounts = {};
    state.accounts.forEach(a => netAmounts[a.id] = 0);

    state.transactions.filter(t => t.type === 'TRANSFER').forEach(tx => {
        netAmounts[tx.from] -= tx.amount;
        netAmounts[tx.to] += tx.amount;
    });

    await sleep(800);
    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    // Record settlement
    const settlementData = {
        settlementId: 'SET-' + generateId().toUpperCase(),
        type: 'SETTLEMENT',
        netAmounts: netAmounts,
        txCount: state.transactions.length,
        timestamp: new Date().toISOString()
    };

    const encryptedSettlement = await crypto.encrypt(state.encryptionKey, settlementData);
    const prevHash = state.hashChain[state.hashChain.length - 1].hash;
    const settlementHash = await crypto.sha256(JSON.stringify(settlementData) + prevHash);

    state.hashChain.push({
        index: state.hashChain.length,
        type: 'SETTLEMENT',
        data: settlementData,
        encryptedData: encryptedSettlement,
        hash: settlementHash,
        prevHash: prevHash
    });

    state.settlements.push(settlementData);

    await sleep(800);
    updateProcessingStep(2, 'done');
    updateProcessingStep(3, 'active');

    await sleep(400);
    updateProcessingStep(3, 'done');

    await sleep(500);
    hideProcessingModal();

    // Update UI
    addSettlementLog(settlementData, settlementHash);
    updateStats();

    // Clear transactions for next batch
    state.transactions = [];
    updateSettlementPreview();
}

// Add transaction log
function addTransactionLog(tx, hash) {
    const container = document.getElementById('transactionLog');
    const empty = container.querySelector('.log-empty');
    if (empty) empty.remove();

    const fromAccount = state.accounts.find(a => a.id === tx.from);
    const toAccount = state.accounts.find(a => a.id === tx.to);

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <div class="log-entry-header">
            <div class="log-type">
                <span class="log-type-icon transfer">💸</span>
                <span>암호화 송금</span>
            </div>
            <span class="log-time">${formatTime(new Date(tx.timestamp))}</span>
        </div>
        <div class="log-details">
            <div class="log-detail">
                <span class="log-detail-label">출금</span>
                <span class="log-detail-value">${fromAccount.icon} ${fromAccount.name}</span>
            </div>
            <div class="log-detail">
                <span class="log-detail-label">입금</span>
                <span class="log-detail-value">${toAccount.icon} ${toAccount.name}</span>
            </div>
            <div class="log-detail">
                <span class="log-detail-label">금액</span>
                <span class="log-detail-value">${formatKRWFull(tx.amount)}</span>
            </div>
        </div>
        <div class="log-hash">🔗 ${hash.substring(0, 48)}...</div>
    `;
    container.insertBefore(entry, container.firstChild);

    document.getElementById('logCount').textContent = `${state.transactions.length}건`;
}

// Add settlement log
function addSettlementLog(settlement, hash) {
    const container = document.getElementById('transactionLog');

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <div class="log-entry-header">
            <div class="log-type">
                <span class="log-type-icon settlement">🔄</span>
                <span>일괄 정산 완료</span>
            </div>
            <span class="log-time">${formatTime(new Date(settlement.timestamp))}</span>
        </div>
        <div class="log-details">
            <div class="log-detail">
                <span class="log-detail-label">정산 ID</span>
                <span class="log-detail-value">${settlement.settlementId}</span>
            </div>
            <div class="log-detail">
                <span class="log-detail-label">처리 건수</span>
                <span class="log-detail-value">${settlement.txCount}건</span>
            </div>
        </div>
        <div class="log-hash">🔗 ${hash.substring(0, 48)}...</div>
    `;
    container.insertBefore(entry, container.firstChild);
}

// Update settlement preview
function updateSettlementPreview() {
    const container = document.getElementById('settlementPreview');
    const btn = document.getElementById('settlementBtn');

    if (state.transactions.length === 0) {
        container.innerHTML = '<div class="preview-placeholder">거래 내역이 쌓이면 정산 미리보기가 표시됩니다</div>';
        btn.disabled = true;
        return;
    }

    // Calculate net positions
    const netAmounts = {};
    state.accounts.forEach(a => netAmounts[a.id] = 0);

    state.transactions.filter(t => t.type === 'TRANSFER').forEach(tx => {
        netAmounts[tx.from] -= tx.amount;
        netAmounts[tx.to] += tx.amount;
    });

    let html = '<div class="settlement-items">';
    state.accounts.forEach(account => {
        const net = netAmounts[account.id];
        if (net !== 0) {
            const cls = net > 0 ? 'positive' : 'negative';
            html += `
                <div class="settlement-item ${cls}">
                    <span class="item-name">${account.icon} ${account.name}</span>
                    <span class="item-amount">${net > 0 ? '+' : ''}${formatKRWFull(net)}</span>
                </div>
            `;
        }
    });
    html += `<div class="settlement-summary">총 ${state.transactions.length}건 거래 → 정산 대기</div>`;
    html += '</div>';

    container.innerHTML = html;
    btn.disabled = false;

    // Add styles if not exist
    if (!document.getElementById('settlementStyles')) {
        const style = document.createElement('style');
        style.id = 'settlementStyles';
        style.textContent = `
            .settlement-items { display: flex; flex-direction: column; gap: 8px; }
            .settlement-item { display: flex; justify-content: space-between; padding: 10px 14px; background: var(--bg-elevated); border-radius: 8px; font-size: 13px; }
            .settlement-item.positive .item-amount { color: var(--success-light); }
            .settlement-item.negative .item-amount { color: var(--danger-light); }
            .item-amount { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
            .settlement-summary { text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        `;
        document.head.appendChild(style);
    }
}

// Request disclosure
async function requestDisclosure() {
    const targetId = document.getElementById('disclosureTarget').value;
    const reason = document.getElementById('disclosureReason').value;

    if (!targetId) {
        alert('열람 대상 계정을 선택해주세요.');
        return;
    }

    const targetAccount = state.accounts.find(a => a.id === targetId);

    state.approvalState = {
        active: true,
        targetAccount: targetAccount,
        reason: reason,
        approvedNodes: []
    };

    // Show approval modal
    openApprovalModal(targetAccount, reason);
}

// Open approval modal
function openApprovalModal(account, reason) {
    const modal = document.getElementById('approvalModal');
    const body = document.getElementById('approvalBody');

    const reasonText = {
        'audit': '감사 요청',
        'investigation': '수사 협조',
        'dispute': '분쟁 조정',
        'recovery': '키 분실 복구'
    }[reason];

    body.innerHTML = `
        <div class="approval-info">
            <div class="approval-target">
                <span class="target-label">열람 대상</span>
                <span class="target-value">${account.icon} ${account.name} (${account.type})</span>
            </div>
            <div class="approval-reason">
                <span class="reason-label">요청 사유</span>
                <span class="reason-value">${reasonText}</span>
            </div>
        </div>
        <div class="approval-threshold">
            <span>승인 임계값:</span>
            <strong>⌈6/3⌉ = 2개 노드</strong>
        </div>
        <div class="approval-nodes">
            ${kmsNodes.map((node, i) => `
                <div class="approval-node" data-node="${node.id}">
                    <div class="approval-node-info">
                        <span class="node-icon">${node.icon}</span>
                        <span class="node-name">${node.name}</span>
                        <span class="node-type">${node.type}</span>
                    </div>
                    <button class="btn btn-sm btn-outline approve-btn" onclick="approveNode('${node.id}', ${i})">
                        승인
                    </button>
                </div>
            `).join('')}
        </div>
        <div class="approval-progress">
            <span>승인 진행: <strong id="approvalCount">0</strong> / 2</span>
        </div>
    `;

    // Add styles
    if (!document.getElementById('approvalStyles')) {
        const style = document.createElement('style');
        style.id = 'approvalStyles';
        style.textContent = `
            .approval-info { display: flex; gap: 24px; margin-bottom: 20px; }
            .approval-target, .approval-reason { flex: 1; background: var(--bg-elevated); padding: 16px; border-radius: 12px; }
            .target-label, .reason-label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            .target-value, .reason-value { font-size: 15px; font-weight: 600; }
            .approval-threshold { text-align: center; padding: 12px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; margin-bottom: 20px; font-size: 14px; }
            .approval-nodes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
            .approval-node { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--bg-elevated); border-radius: 12px; border: 1px solid var(--border); }
            .approval-node.approved { border-color: var(--success); background: rgba(16, 185, 129, 0.1); }
            .approval-node.approved .approve-btn { background: var(--success); color: white; border-color: var(--success); pointer-events: none; }
            .approval-node-info { display: flex; align-items: center; gap: 12px; }
            .approval-node-info .node-icon { font-size: 24px; }
            .approval-node-info .node-name { font-weight: 600; }
            .approval-node-info .node-type { font-size: 12px; color: var(--text-muted); }
            .approval-progress { text-align: center; padding: 16px; background: var(--bg-dark); border-radius: 10px; font-size: 14px; }
            .approval-progress strong { color: var(--primary-light); }
        `;
        document.head.appendChild(style);
    }

    modal.classList.add('active');
}

// Approve node
async function approveNode(nodeId, index) {
    if (state.approvalState.approvedNodes.includes(nodeId)) return;

    state.approvalState.approvedNodes.push(nodeId);

    // Update modal
    const nodeEl = document.querySelector(`.approval-node[data-node="${nodeId}"]`);
    nodeEl.classList.add('approved');
    nodeEl.querySelector('.approve-btn').textContent = '✓ 승인됨';

    document.getElementById('approvalCount').textContent = state.approvalState.approvedNodes.length;

    // Update main nodes display
    const mainNodeEl = document.querySelector(`.node-card[data-id="${nodeId}"]`);
    mainNodeEl.classList.add('approved');
    mainNodeEl.querySelector('.node-status').textContent = '승인';
    mainNodeEl.querySelector('.node-status').classList.add('approved');

    // Check if threshold reached
    if (state.approvalState.approvedNodes.length >= 2) {
        await sleep(500);
        closeApprovalModal();
        await completeDisclosure();
    }
}

// Close approval modal
function closeApprovalModal() {
    document.getElementById('approvalModal').classList.remove('active');
}

// Complete disclosure
async function completeDisclosure() {
    showProcessingModal('열람 권한 복호화 중', [
        { text: '분산 키 조합', status: 'active' },
        { text: '데이터 복호화', status: 'pending' },
        { text: '감사 로그 기록', status: 'pending' }
    ]);

    await sleep(800);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    await sleep(600);
    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    // Record disclosure to hash chain
    const disclosureData = {
        type: 'DISCLOSURE',
        targetAccount: state.approvalState.targetAccount.id,
        reason: state.approvalState.reason,
        approvedBy: state.approvalState.approvedNodes,
        timestamp: new Date().toISOString()
    };

    const prevHash = state.hashChain[state.hashChain.length - 1].hash;
    const disclosureHash = await crypto.sha256(JSON.stringify(disclosureData) + prevHash);

    state.hashChain.push({
        index: state.hashChain.length,
        type: 'DISCLOSURE',
        data: disclosureData,
        hash: disclosureHash,
        prevHash: prevHash
    });

    await sleep(400);
    updateProcessingStep(2, 'done');

    await sleep(500);
    hideProcessingModal();

    // Show disclosure result
    showDisclosureResult(state.approvalState.targetAccount, disclosureHash);
    updateStats();

    // Update main display
    document.getElementById('nodesStatus').textContent = '승인 완료';
    document.getElementById('nodesStatus').className = 'nodes-status approved';

    // Reset approval state
    state.approvalState = {
        active: false,
        targetAccount: null,
        reason: null,
        approvedNodes: []
    };
}

// Show disclosure result
function showDisclosureResult(account, hash) {
    const container = document.getElementById('disclosureResult');
    const content = document.getElementById('disclosureContent');

    content.innerHTML = `
        <div class="disclosed-info">
            <div class="disclosed-item">
                <span class="disclosed-label">계정명</span>
                <span class="disclosed-value">${account.icon} ${account.name}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">계정 유형</span>
                <span class="disclosed-value">${account.type}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">계정 ID</span>
                <span class="disclosed-value">${account.id}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">현재 잔고</span>
                <span class="disclosed-value highlight">${formatKRWFull(account.plainBalance)}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">열람 승인 해시</span>
                <span class="disclosed-value" style="font-size: 10px; font-family: monospace;">${hash.substring(0, 32)}...</span>
            </div>
        </div>
    `;

    container.style.display = 'block';
}

// Verify integrity
async function verifyIntegrity() {
    showProcessingModal('해시 체인 무결성 검증 중', [
        { text: '체인 연결성 검증', status: 'active' },
        { text: '해시 값 재계산', status: 'pending' },
        { text: '검증 완료', status: 'pending' }
    ]);

    await sleep(800);
    let valid = true;

    // Verify chain linkage
    for (let i = 1; i < state.hashChain.length; i++) {
        if (state.hashChain[i].prevHash !== state.hashChain[i - 1].hash) {
            valid = false;
            break;
        }
    }

    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    await sleep(800);

    // Verify hash calculations
    for (let i = 0; i < state.hashChain.length; i++) {
        const block = state.hashChain[i];
        const recalculated = await crypto.sha256(JSON.stringify(block.data) + block.prevHash);
        if (recalculated !== block.hash) {
            valid = false;
            break;
        }
    }

    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    await sleep(400);
    updateProcessingStep(2, 'done');

    await sleep(500);
    hideProcessingModal();

    // Show result
    if (valid) {
        alert(`✅ 검증 성공!\n\n모든 ${state.hashChain.length}개 블록의 무결성이 확인되었습니다.`);
    } else {
        alert('⚠️ 검증 실패!\n\n데이터 변조가 감지되었습니다.');
    }
}

// Processing modal helpers
function showProcessingModal(title, steps) {
    const modal = document.getElementById('processingModal');
    document.getElementById('processingTitle').textContent = title;
    document.getElementById('processingDesc').textContent = '암호문 상태로 연산을 수행합니다...';

    const stepsContainer = document.getElementById('processingSteps');
    stepsContainer.innerHTML = steps.map((step, i) => `
        <div class="step-item" data-step="${i}">
            <span class="step-icon ${step.status}">${step.status === 'done' ? '✓' : (step.status === 'active' ? '⋯' : '○')}</span>
            <span class="step-text">${step.text}</span>
        </div>
    `).join('');

    modal.classList.add('active');
}

function updateProcessingStep(index, status) {
    const step = document.querySelector(`.step-item[data-step="${index}"]`);
    if (step) {
        const icon = step.querySelector('.step-icon');
        icon.className = `step-icon ${status}`;
        icon.textContent = status === 'done' ? '✓' : (status === 'active' ? '⋯' : '○');
    }
}

function hideProcessingModal() {
    document.getElementById('processingModal').classList.remove('active');
}

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
