// ========================================
// IRONVEIL Vault Demo v2.0 - User Wallets & Transactions
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

    async sha256(str) {
        const encoder = new TextEncoder();
        const hash = await window.crypto.subtle.digest('SHA-256', encoder.encode(str));
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    generateAddress() {
        const chars = '0123456789abcdef';
        let addr = '0x';
        for (let i = 0; i < 40; i++) {
            addr += chars[Math.floor(Math.random() * 16)];
        }
        return addr;
    },

    shortenAddress(addr) {
        return addr.slice(0, 6) + '...' + addr.slice(-4);
    }
};

// Users/Institutions data
const users = [
    { id: 'user_1', name: '한국증권', type: '증권사', icon: '📈', balance: 5000000000 },
    { id: 'user_2', name: '미래투자', type: '증권사', icon: '📊', balance: 3500000000 },
    { id: 'user_3', name: '국민은행', type: '은행', icon: '🏦', balance: 10000000000 },
    { id: 'user_4', name: '서울시', type: '지자체', icon: '🏛️', balance: 2000000000 },
    { id: 'user_5', name: '삼성전자', type: '기업', icon: '🏢', balance: 8000000000 }
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
    currentUserId: 'user_1',
    accounts: [],
    allTransactions: [], // All transactions in the network
    hashChain: [],
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

function formatDateTime(date) {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' + formatTime(date);
}

// Get current user
function getCurrentUser() {
    return state.accounts.find(a => a.id === state.currentUserId);
}

// Initialize demo
async function initDemo() {
    state.encryptionKey = await crypto.generateKey();

    // Initialize accounts with addresses and encrypted balances
    for (const user of users) {
        const address = crypto.generateAddress();
        const encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: user.balance });
        state.accounts.push({
            ...user,
            address,
            encryptedBalance,
            plainBalance: user.balance
        });
    }

    // Create genesis block
    const genesisData = {
        type: 'GENESIS',
        timestamp: new Date().toISOString(),
        accounts: state.accounts.map(a => ({ id: a.id, address: a.address }))
    };
    const genesisHash = await crypto.sha256(JSON.stringify(genesisData));
    state.hashChain.push({
        index: 0,
        type: 'GENESIS',
        data: genesisData,
        hash: genesisHash,
        prevHash: '0'.repeat(64)
    });

    // Setup UI
    populateUserSwitcher();
    updateMyWallet();
    renderParticipants();
    renderNodes();
    populateDisclosureSelect();
    updateStats();

    // Setup address input listener
    document.getElementById('toAddress').addEventListener('input', handleAddressInput);

    console.log('IRONVEIL Vault Demo v2.0 initialized');
}

// Populate user switcher
function populateUserSwitcher() {
    const switcher = document.getElementById('currentUser');
    switcher.innerHTML = '';
    state.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.icon} ${account.name}`;
        if (account.id === state.currentUserId) option.selected = true;
        switcher.appendChild(option);
    });
}

// Switch user
function switchUser(userId) {
    state.currentUserId = userId;
    updateMyWallet();
    renderMyTransactions();
    renderParticipants();
}

// Update my wallet display
function updateMyWallet() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('myAvatar').textContent = user.icon;
    document.getElementById('myName').textContent = user.name;
    document.getElementById('myType').textContent = user.type;
    document.getElementById('myAddress').textContent = crypto.shortenAddress(user.address);
    document.getElementById('myBalance').textContent = formatKRW(user.plainBalance);
    document.getElementById('myEncrypted').textContent = user.encryptedBalance.ciphertext.substring(0, 16) + '...';
}

// Copy address
function copyAddress() {
    const user = getCurrentUser();
    navigator.clipboard.writeText(user.address);

    const btn = document.querySelector('.copy-btn');
    btn.innerHTML = '✓';
    setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>`;
    }, 1500);
}

// Render participants (excluding current user)
function renderParticipants() {
    const container = document.getElementById('participantList');
    const currentUser = getCurrentUser();

    container.innerHTML = '';
    state.accounts
        .filter(a => a.id !== state.currentUserId)
        .forEach(account => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.onclick = () => selectParticipant(account);
            item.innerHTML = `
                <div class="participant-avatar">${account.icon}</div>
                <div class="participant-info">
                    <div class="participant-name">${account.name}</div>
                    <div class="participant-address">${crypto.shortenAddress(account.address)}</div>
                </div>
                <span class="participant-type">${account.type}</span>
            `;
            container.appendChild(item);
        });

    document.getElementById('participantCount').textContent = `${state.accounts.length - 1}명`;
}

// Select participant
function selectParticipant(account) {
    document.getElementById('toAddress').value = account.address;
    showAddressPreview(account);
}

// Handle address input
function handleAddressInput(e) {
    const value = e.target.value.trim();
    const preview = document.getElementById('addressPreview');

    if (!value) {
        preview.style.display = 'none';
        return;
    }

    // Find matching account
    const account = state.accounts.find(a =>
        a.address.toLowerCase() === value.toLowerCase() ||
        a.name.toLowerCase().includes(value.toLowerCase())
    );

    if (account && account.id !== state.currentUserId) {
        showAddressPreview(account);
        if (account.address.toLowerCase() !== value.toLowerCase()) {
            document.getElementById('toAddress').value = account.address;
        }
    } else {
        preview.style.display = 'none';
    }
}

// Show address preview
function showAddressPreview(account) {
    const preview = document.getElementById('addressPreview');
    document.getElementById('previewIcon').textContent = account.icon;
    document.getElementById('previewName').textContent = account.name;
    document.getElementById('previewType').textContent = account.type;
    preview.style.display = 'flex';
}

// Open address book modal
function openAddressBook() {
    const modal = document.getElementById('addressBookModal');
    renderAddressBookList();
    modal.classList.add('active');
}

// Close address book
function closeAddressBook() {
    document.getElementById('addressBookModal').classList.remove('active');
}

// Render address book list
function renderAddressBookList(filter = '') {
    const container = document.getElementById('addressBookList');
    container.innerHTML = '';

    state.accounts
        .filter(a => a.id !== state.currentUserId)
        .filter(a => !filter ||
            a.name.toLowerCase().includes(filter.toLowerCase()) ||
            a.address.toLowerCase().includes(filter.toLowerCase()))
        .forEach(account => {
            const item = document.createElement('div');
            item.className = 'address-book-item';
            item.onclick = () => {
                document.getElementById('toAddress').value = account.address;
                showAddressPreview(account);
                closeAddressBook();
            };
            item.innerHTML = `
                <div class="item-avatar">${account.icon}</div>
                <div class="item-info">
                    <div class="item-name">${account.name}</div>
                    <div class="item-address">${account.address}</div>
                </div>
                <span class="item-type">${account.type}</span>
            `;
            container.appendChild(item);
        });
}

// Filter addresses
function filterAddresses(query) {
    renderAddressBookList(query);
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

// Populate disclosure select
function populateDisclosureSelect() {
    const select = document.getElementById('disclosureTarget');
    select.innerHTML = '<option value="">주소 선택</option>';
    state.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.icon} ${account.name} (${crypto.shortenAddress(account.address)})`;
        select.appendChild(option);
    });
}

// Update statistics
function updateStats() {
    document.getElementById('chainLength').textContent = `${state.hashChain.length} 블록`;

    if (state.hashChain.length > 0) {
        const lastHash = state.hashChain[state.hashChain.length - 1].hash;
        document.getElementById('merkleRoot').textContent = lastHash.substring(0, 24) + '...';
    }

    if (state.allTransactions.length > 0) {
        document.getElementById('verifyBtn').disabled = false;
    }
}

// Set quick amount
function setAmount(amount) {
    document.getElementById('sendAmount').value = amount.toLocaleString();
}

// Execute send
async function executeSend() {
    const toAddress = document.getElementById('toAddress').value.trim();
    const amountStr = document.getElementById('sendAmount').value.replace(/,/g, '');
    const memo = document.getElementById('sendMemo').value.trim();
    const amount = parseInt(amountStr);

    const fromAccount = getCurrentUser();
    const toAccount = state.accounts.find(a => a.address.toLowerCase() === toAddress.toLowerCase());

    if (!toAccount) {
        alert('유효한 수신 주소를 입력해주세요.');
        return;
    }

    if (toAccount.id === state.currentUserId) {
        alert('자기 자신에게 송금할 수 없습니다.');
        return;
    }

    if (!amount || amount <= 0) {
        alert('유효한 금액을 입력해주세요.');
        return;
    }

    if (fromAccount.plainBalance < amount) {
        alert('잔고가 부족합니다.');
        return;
    }

    // Show processing modal
    showProcessingModal('FHE16 암호화 송금 처리 중', [
        { text: '거래 데이터 암호화', status: 'active' },
        { text: '잔고 업데이트 (암호문 연산)', status: 'pending' },
        { text: '해시 체인 기록', status: 'pending' },
        { text: '트랜잭션 브로드캐스트', status: 'pending' }
    ]);

    // Step 1: Encrypt transaction
    await sleep(800);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    // Step 2: Update balances
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
        from: fromAccount.id,
        fromAddress: fromAccount.address,
        to: toAccount.id,
        toAddress: toAccount.address,
        amount: amount,
        memo: memo || null,
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

    state.allTransactions.push({
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

    updateMyWallet();
    renderMyTransactions();
    addNetworkLog(txData);
    updateStats();

    // Clear form
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendMemo').value = '';
    document.getElementById('toAddress').value = '';
    document.getElementById('addressPreview').style.display = 'none';
}

// Render my transactions
function renderMyTransactions() {
    const container = document.getElementById('myTransactions');
    const currentUser = getCurrentUser();

    // Filter transactions involving current user
    const myTxs = state.allTransactions.filter(tx =>
        tx.from === currentUser.id || tx.to === currentUser.id
    ).reverse();

    if (myTxs.length === 0) {
        container.innerHTML = '<div class="tx-empty">아직 거래 내역이 없습니다</div>';
        document.getElementById('myTxCount').textContent = '0건';
        return;
    }

    container.innerHTML = '';
    myTxs.forEach(tx => {
        const isSent = tx.from === currentUser.id;
        const counterparty = state.accounts.find(a => a.id === (isSent ? tx.to : tx.from));

        const item = document.createElement('div');
        item.className = 'my-tx-item';
        item.innerHTML = `
            <div class="tx-direction ${isSent ? 'sent' : 'received'}">
                ${isSent ? '↑' : '↓'}
            </div>
            <div class="tx-info">
                <div class="tx-counterparty">
                    ${isSent ? '→' : '←'} ${counterparty.icon} ${counterparty.name}
                </div>
                <div class="tx-time">${formatDateTime(new Date(tx.timestamp))}</div>
            </div>
            <div class="tx-amount ${isSent ? 'sent' : 'received'}">
                ${isSent ? '-' : '+'}${formatKRW(tx.amount)}
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById('myTxCount').textContent = `${myTxs.length}건`;
}

// Add network log (anonymized view)
function addNetworkLog(tx) {
    const container = document.getElementById('networkLog');
    const empty = container.querySelector('.log-empty');
    if (empty) empty.remove();

    const fromAccount = state.accounts.find(a => a.id === tx.from);
    const toAccount = state.accounts.find(a => a.id === tx.to);
    const currentUser = getCurrentUser();

    // Check if current user is involved
    const isInvolved = tx.from === currentUser.id || tx.to === currentUser.id;

    const item = document.createElement('div');
    item.className = 'network-tx-item';
    item.innerHTML = `
        <div class="network-tx-header">
            <div class="network-tx-type">
                <span class="icon">💸</span>
                <span>Transfer</span>
            </div>
            <span class="network-tx-time">${formatTime(new Date(tx.timestamp))}</span>
        </div>
        <div class="network-tx-flow">
            <span>${crypto.shortenAddress(tx.fromAddress)}</span>
            <span class="arrow">→</span>
            <span>${crypto.shortenAddress(tx.toAddress)}</span>
        </div>
        <div class="network-tx-amount">
            ${isInvolved ? formatKRWFull(tx.amount) : '🔒 [암호화됨]'}
        </div>
    `;
    container.insertBefore(item, container.firstChild);

    const count = container.querySelectorAll('.network-tx-item').length;
    document.getElementById('networkLogCount').textContent = `${count}건`;
}

// Request disclosure
async function requestDisclosure() {
    const targetId = document.getElementById('disclosureTarget').value;
    const reason = document.getElementById('disclosureReason').value;

    if (!targetId) {
        alert('열람 대상 주소를 선택해주세요.');
        return;
    }

    const targetAccount = state.accounts.find(a => a.id === targetId);

    state.approvalState = {
        active: true,
        targetAccount: targetAccount,
        reason: reason,
        approvedNodes: []
    };

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
                <span class="target-value">${account.icon} ${account.name}</span>
                <div style="font-size: 11px; color: var(--primary-light); margin-top: 4px; font-family: monospace;">${account.address}</div>
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

    // Add styles if not exist
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
        targetAddress: state.approvalState.targetAccount.address,
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

    // Get transactions for this account
    const accountTxs = state.allTransactions.filter(tx =>
        tx.from === account.id || tx.to === account.id
    );

    content.innerHTML = `
        <div class="disclosed-info">
            <div class="disclosed-item">
                <span class="disclosed-label">계정명</span>
                <span class="disclosed-value">${account.icon} ${account.name}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">지갑 주소</span>
                <span class="disclosed-value" style="font-size: 11px; font-family: monospace;">${account.address}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">계정 유형</span>
                <span class="disclosed-value">${account.type}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">현재 잔고</span>
                <span class="disclosed-value highlight">${formatKRWFull(account.plainBalance)}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">거래 건수</span>
                <span class="disclosed-value">${accountTxs.length}건</span>
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

    if (valid) {
        alert(`✅ 검증 성공!\n\n모든 ${state.hashChain.length}개 블록의 무결성이 확인되었습니다.`);
    } else {
        alert('⚠️ 검증 실패!\n\n데이터 변조가 감지되었습니다.');
    }
}

// Reset demo
async function resetDemo() {
    state = {
        encryptionKey: await crypto.generateKey(),
        currentUserId: 'user_1',
        accounts: [],
        allTransactions: [],
        hashChain: [],
        approvalState: {
            active: false,
            targetAccount: null,
            reason: null,
            approvedNodes: []
        }
    };

    // Reinitialize
    for (const user of users) {
        const address = crypto.generateAddress();
        const encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: user.balance });
        state.accounts.push({
            ...user,
            address,
            encryptedBalance,
            plainBalance: user.balance
        });
    }

    // Create genesis block
    const genesisData = {
        type: 'GENESIS',
        timestamp: new Date().toISOString(),
        accounts: state.accounts.map(a => ({ id: a.id, address: a.address }))
    };
    const genesisHash = await crypto.sha256(JSON.stringify(genesisData));
    state.hashChain.push({
        index: 0,
        type: 'GENESIS',
        data: genesisData,
        hash: genesisHash,
        prevHash: '0'.repeat(64)
    });

    // Reset UI
    populateUserSwitcher();
    updateMyWallet();
    renderMyTransactions();
    renderParticipants();
    renderNodes();
    populateDisclosureSelect();
    updateStats();

    document.getElementById('networkLog').innerHTML = `
        <div class="log-empty">
            네트워크 거래가 발생하면 표시됩니다<br/>
            <small>※ 금액과 상세 정보는 암호화되어 표시</small>
        </div>
    `;
    document.getElementById('networkLogCount').textContent = '0건';
    document.getElementById('disclosureResult').style.display = 'none';
    document.getElementById('verifyBtn').disabled = true;
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendMemo').value = '';
    document.getElementById('toAddress').value = '';
    document.getElementById('addressPreview').style.display = 'none';

    // Reset nodes
    document.querySelectorAll('.node-card').forEach(node => {
        node.classList.remove('approving', 'approved');
        node.querySelector('.node-status').textContent = '대기';
        node.querySelector('.node-status').classList.remove('approved');
    });
    document.getElementById('nodesStatus').textContent = '대기 중';
    document.getElementById('nodesStatus').className = 'nodes-status';

    console.log('Demo reset complete');
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
