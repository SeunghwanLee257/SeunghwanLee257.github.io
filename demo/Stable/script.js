// ========================================
// IRONVEIL Vault Demo v3.0 - Enterprise PoC
// P0 Features: Multi-Role View, State Changes, Disclosure Process
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
    },

    generateCaseId() {
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(-2) +
                       (date.getMonth() + 1).toString().padStart(2, '0') +
                       date.getDate().toString().padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `CASE-${dateStr}-${random}`;
    },

    generateTxId() {
        return 'TX-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    },

    // Merkle tree simulation
    async computeMerkleRoot(hashes) {
        if (hashes.length === 0) return '0'.repeat(64);
        if (hashes.length === 1) return hashes[0];

        const newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left;
            newLevel.push(await this.sha256(left + right));
        }
        return this.computeMerkleRoot(newLevel);
    }
};

// Users/Institutions data with KYC info (P1-6)
const users = [
    { id: 'user_1', name: '한국증권', type: '증권사', icon: '📈', balance: 5000000000, kycVerified: true, kycId: 'KYC-2024-001' },
    { id: 'user_2', name: '미래투자', type: '증권사', icon: '📊', balance: 3500000000, kycVerified: true, kycId: 'KYC-2024-002' },
    { id: 'user_3', name: '국민은행', type: '은행', icon: '🏦', balance: 10000000000, kycVerified: true, kycId: 'KYC-2024-003' },
    { id: 'user_4', name: '서울시', type: '지자체', icon: '🏛️', balance: 2000000000, kycVerified: true, kycId: 'KYC-2024-004' },
    { id: 'user_5', name: '삼성전자', type: '기업', icon: '🏢', balance: 8000000000, kycVerified: true, kycId: 'KYC-2024-005' }
];

// GovSplit KMS nodes with role-based policy (P1-8)
const kmsNodes = [
    { id: 'node_1', name: '금융위', icon: '🏛️', type: '감독기관', category: 'regulator', required: true },
    { id: 'node_2', name: '한국은행', icon: '🏦', type: '중앙은행', category: 'central_bank', required: false },
    { id: 'node_3', name: '코스콤', icon: '🖥️', type: '인프라', category: 'infrastructure', required: false },
    { id: 'node_4', name: '예탁결제원', icon: '📋', type: '결제기관', category: 'settlement', required: false },
    { id: 'node_5', name: '감사위원', icon: '⚖️', type: '감사', category: 'audit', required: false },
    { id: 'node_6', name: '옴부즈만', icon: '👤', type: '분쟁조정', category: 'dispute', required: false }
];

// Approval policies for different reasons (P1-8)
const approvalPolicies = {
    audit: {
        name: '감사 요청',
        rule: '감독기관(필수) + 감사위원/다른 1개 노드',
        requiredCategories: ['regulator'],
        minApprovals: 2
    },
    investigation: {
        name: '수사 협조',
        rule: '감독기관(필수) + 중앙은행/결제기관 1개',
        requiredCategories: ['regulator'],
        minApprovals: 2
    },
    dispute: {
        name: '분쟁 조정',
        rule: '옴부즈만(필수) + 감독기관',
        requiredCategories: ['dispute', 'regulator'],
        minApprovals: 2
    },
    recovery: {
        name: '키 분실 복구',
        rule: '감독기관(필수) + 발행기관 확인 + 1개 노드',
        requiredCategories: ['regulator'],
        minApprovals: 2
    }
};

// Role definitions for multi-view (P0-1)
const roles = {
    user: {
        name: '사용자',
        icon: '👤',
        description: '본인 잔고와 거래 내역을 볼 수 있으며, 타인 정보는 암호화되어 표시됩니다.',
        canSeeOwnBalance: true,
        canSeeOwnTransactions: true,
        canSeeOthersBalance: false,
        canSeeOthersTransactions: false,
        canSeeKYC: false,
        canApproveDisclosure: false
    },
    counterparty: {
        name: '상대방',
        icon: '🤝',
        description: '상대방 관점: 나와 관련된 거래만 볼 수 있으며, 다른 참여자 정보는 암호화됩니다.',
        canSeeOwnBalance: true,
        canSeeOwnTransactions: true,
        canSeeOthersBalance: false,
        canSeeOthersTransactions: false,
        canSeeKYC: false,
        canApproveDisclosure: false
    },
    issuer: {
        name: '발행기관',
        icon: '🏦',
        description: '지갑주소↔KYC매핑 보유. 잔고/거래는 볼 수 없으나 열람 요청 시 GovSplit 절차로 제한 공개.',
        canSeeOwnBalance: false,
        canSeeOwnTransactions: false,
        canSeeOthersBalance: false,
        canSeeOthersTransactions: false,
        canSeeKYC: true,
        canApproveDisclosure: false
    },
    govsplit: {
        name: 'GovSplit 노드',
        icon: '🔐',
        description: '분산 키 관리. 열람 승인만 가능하며, 단독으로 데이터를 복호화할 수 없습니다.',
        canSeeOwnBalance: false,
        canSeeOwnTransactions: false,
        canSeeOthersBalance: false,
        canSeeOthersTransactions: false,
        canSeeKYC: false,
        canApproveDisclosure: true
    },
    auditor: {
        name: '감사자',
        icon: '⚖️',
        description: '열람 승인 후 범위 제한된 정보만 열람 가능. 전체 데이터 접근 불가.',
        canSeeOwnBalance: false,
        canSeeOwnTransactions: false,
        canSeeOthersBalance: false,
        canSeeOthersTransactions: false,
        canSeeKYC: false,
        canApproveDisclosure: false,
        canViewApprovedDisclosures: true
    }
};

// Application state
let state = {
    encryptionKey: null,
    currentUserId: 'user_1',
    currentRole: 'user',
    accounts: [],
    allTransactions: [],
    hashChain: [],
    merkleRoot: null,
    disclosureCases: [],
    approvalState: {
        active: false,
        caseId: null,
        targetAccount: null,
        reason: null,
        scope: null,
        disclosureOptions: {},
        approvedNodes: [],
        policy: null
    },
    lastVerification: null
};

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

function formatFullDateTime(date) {
    return date.toLocaleDateString('ko-KR') + ' ' + formatTime(date);
}

// Get current user
function getCurrentUser() {
    return state.accounts.find(a => a.id === state.currentUserId);
}

// Get role config
function getCurrentRoleConfig() {
    return roles[state.currentRole];
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

    // Compute initial Merkle root
    state.merkleRoot = await crypto.computeMerkleRoot([genesisHash]);

    // Setup UI
    populateUserSwitcher();
    updateRoleBanner();
    updateViewForRole();
    renderParticipants();
    renderNodes();
    populateDisclosureSelect();
    updateStats();

    // Setup event listeners
    document.getElementById('toAddress').addEventListener('input', handleAddressInput);

    console.log('IRONVEIL Vault Demo v3.0 initialized');
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

// Switch user (P0-1)
function switchUser(userId) {
    state.currentUserId = userId;
    updateViewForRole();
}

// Switch role (P0-1 핵심)
function switchRole(role) {
    state.currentRole = role;

    // Update tab UI
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.role === role) {
            tab.classList.add('active');
        }
    });

    updateRoleBanner();
    updateViewForRole();
}

// Update role banner (P0-1)
function updateRoleBanner() {
    const banner = document.getElementById('roleBanner');
    const roleConfig = getCurrentRoleConfig();
    const currentUser = getCurrentUser();

    banner.setAttribute('data-role', state.currentRole);

    let title = '';
    if (state.currentRole === 'user') {
        title = `<strong>사용자 A (${currentUser.name})</strong> 관점으로 보고 있습니다`;
    } else if (state.currentRole === 'counterparty') {
        const otherUser = state.accounts.find(a => a.id !== state.currentUserId);
        title = `<strong>상대방 (${otherUser?.name})</strong> 관점으로 보고 있습니다`;
    } else if (state.currentRole === 'issuer') {
        title = `<strong>발행기관 (정산기관)</strong> 관점으로 보고 있습니다`;
    } else if (state.currentRole === 'govsplit') {
        title = `<strong>GovSplit 노드 (금융위)</strong> 관점으로 보고 있습니다`;
    } else if (state.currentRole === 'auditor') {
        title = `<strong>감사자 (열람권자)</strong> 관점으로 보고 있습니다`;
    }

    banner.querySelector('.role-banner-icon').textContent = roleConfig.icon;
    banner.querySelector('.role-banner-text').innerHTML = title;
    banner.querySelector('.role-banner-desc').textContent = roleConfig.description;
}

// Update view for current role (P0-1 핵심)
function updateViewForRole() {
    const roleConfig = getCurrentRoleConfig();
    const user = getCurrentUser();

    updateWalletDisplay(roleConfig, user);
    renderMyTransactions();
    renderNetworkLog();
    updatePrivacyInfo(roleConfig);
    updateSendFormVisibility(roleConfig);
}

// Update wallet display based on role
function updateWalletDisplay(roleConfig, user) {
    const walletCard = document.getElementById('myWalletCard');
    const viewTitle = document.getElementById('viewPanelTitle');
    const balanceLabel = document.getElementById('balanceLabel');
    const balanceAmount = document.getElementById('myBalance');
    const ciphertextValue = document.getElementById('ciphertextValue');

    // Update panel title
    if (state.currentRole === 'user') {
        viewTitle.textContent = '내 지갑';
    } else if (state.currentRole === 'counterparty') {
        const otherUser = state.accounts.find(a => a.id !== state.currentUserId);
        viewTitle.textContent = `${otherUser?.name}의 지갑`;
    } else {
        viewTitle.textContent = '지갑 정보';
    }

    // Update avatar and name
    document.getElementById('myAvatar').textContent = user.icon;
    document.getElementById('myName').textContent = user.name;
    document.getElementById('myType').textContent = user.type;
    document.getElementById('myAddress').textContent = crypto.shortenAddress(user.address);

    // KYC badge
    const kycBadge = document.getElementById('kycBadge');
    if (roleConfig.canSeeKYC) {
        kycBadge.innerHTML = `<span class="kyc-icon">✓</span><span>KYC: ${user.kycId}</span>`;
        kycBadge.style.display = 'flex';
    } else {
        kycBadge.innerHTML = `<span class="kyc-icon">✓</span><span>KYC 인증</span>`;
        kycBadge.style.display = user.kycVerified ? 'flex' : 'none';
    }

    // Balance display based on role
    if (roleConfig.canSeeOwnBalance || (state.currentRole === 'counterparty' && false)) {
        balanceLabel.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>FHE16 암호화 잔고</span>
        `;
        balanceAmount.textContent = formatKRW(user.plainBalance);
        balanceAmount.classList.remove('masked');
        ciphertextValue.textContent = user.encryptedBalance.ciphertext.substring(0, 16) + '...';
    } else {
        balanceLabel.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>암호화됨 (열람 불가)</span>
        `;
        balanceAmount.textContent = '*** 비공개 ***';
        balanceAmount.classList.add('masked');
        ciphertextValue.textContent = user.encryptedBalance.ciphertext.substring(0, 16) + '... (복호화 불가)';
    }
}

// Update privacy info box
function updatePrivacyInfo(roleConfig) {
    const infoBox = document.getElementById('privacyInfoBox');
    const infoIcon = infoBox.querySelector('.info-icon');
    const privacyDesc = document.getElementById('privacyDesc');

    if (state.currentRole === 'user') {
        infoIcon.textContent = '🔒';
        privacyDesc.textContent = '본인 거래만 열람 가능, 타인의 잔고/거래는 볼 수 없음';
    } else if (state.currentRole === 'counterparty') {
        infoIcon.textContent = '🔒';
        privacyDesc.textContent = '상대방은 당신의 잔고/거래 금액을 볼 수 없습니다';
    } else if (state.currentRole === 'issuer') {
        infoIcon.textContent = '🏦';
        privacyDesc.textContent = '주소↔실명 매핑만 보유. 잔고/거래 열람은 GovSplit 승인 필요';
    } else if (state.currentRole === 'govsplit') {
        infoIcon.textContent = '🔐';
        privacyDesc.textContent = '단독 열람 불가. 분산 키 조합으로만 복호화 가능 (2/6 임계값)';
    } else if (state.currentRole === 'auditor') {
        infoIcon.textContent = '⚖️';
        privacyDesc.textContent = '승인된 열람 요청의 범위 내에서만 정보 확인 가능';
    }
}

// Update send form visibility based on role
function updateSendFormVisibility(roleConfig) {
    const sendForm = document.getElementById('sendForm');
    const sendBtn = document.getElementById('sendBtn');

    if (state.currentRole === 'user') {
        sendForm.style.opacity = '1';
        sendForm.style.pointerEvents = 'auto';
        sendBtn.disabled = false;
    } else {
        sendForm.style.opacity = '0.5';
        sendForm.style.pointerEvents = 'none';
        sendBtn.disabled = true;
    }
}

// Render transactions based on role (P0-1)
function renderMyTransactions() {
    const container = document.getElementById('myTransactions');
    const txSectionTitle = document.getElementById('txSectionTitle');
    const roleConfig = getCurrentRoleConfig();
    const currentUser = getCurrentUser();

    // Update section title
    if (state.currentRole === 'user') {
        txSectionTitle.textContent = '내 거래 내역';
    } else if (state.currentRole === 'counterparty') {
        txSectionTitle.textContent = '거래 내역 (비공개)';
    } else if (state.currentRole === 'auditor') {
        txSectionTitle.textContent = '승인된 열람 내역';
    } else {
        txSectionTitle.textContent = '거래 내역 (열람 불가)';
    }

    // Filter transactions based on role
    let myTxs = [];
    if (roleConfig.canSeeOwnTransactions) {
        myTxs = state.allTransactions.filter(tx =>
            tx.from === currentUser.id || tx.to === currentUser.id
        ).reverse();
    }

    if (myTxs.length === 0 && roleConfig.canSeeOwnTransactions) {
        container.innerHTML = '<div class="tx-empty">아직 거래 내역이 없습니다</div>';
        document.getElementById('myTxCount').textContent = '0건';
        return;
    }

    if (!roleConfig.canSeeOwnTransactions) {
        container.innerHTML = '<div class="tx-empty">🔒 열람 권한 없음<br/><small>GovSplit 승인 후 열람 가능</small></div>';
        document.getElementById('myTxCount').textContent = '-';
        return;
    }

    container.innerHTML = '';
    myTxs.forEach(tx => {
        const isSent = tx.from === currentUser.id;
        const counterparty = state.accounts.find(a => a.id === (isSent ? tx.to : tx.from));

        const item = document.createElement('div');
        item.className = 'my-tx-item';
        item.onclick = () => openTxDetailModal(tx);
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

// Render network log based on role
function renderNetworkLog() {
    const container = document.getElementById('networkLog');
    const roleConfig = getCurrentRoleConfig();
    const currentUser = getCurrentUser();

    if (state.allTransactions.length === 0) {
        container.innerHTML = `
            <div class="log-empty">
                네트워크 거래가 발생하면 표시됩니다<br/>
                <small>※ 역할에 따라 표시 정보가 달라집니다</small>
            </div>
        `;
        document.getElementById('networkLogCount').textContent = '0건';
        return;
    }

    container.innerHTML = '';
    state.allTransactions.slice().reverse().forEach(tx => {
        const fromAccount = state.accounts.find(a => a.id === tx.from);
        const toAccount = state.accounts.find(a => a.id === tx.to);
        const isInvolved = tx.from === currentUser.id || tx.to === currentUser.id;

        // Determine what to show based on role
        let amountDisplay = '';
        let flowDisplay = '';

        if (state.currentRole === 'user' && isInvolved) {
            amountDisplay = formatKRWFull(tx.amount);
            flowDisplay = `
                <span>${fromAccount.icon} ${fromAccount.name}</span>
                <span class="arrow">→</span>
                <span>${toAccount.icon} ${toAccount.name}</span>
            `;
        } else if (state.currentRole === 'issuer') {
            amountDisplay = '🔒 [암호화됨]';
            flowDisplay = `
                <span>${crypto.shortenAddress(tx.fromAddress)}</span>
                <span class="arrow">→</span>
                <span>${crypto.shortenAddress(tx.toAddress)}</span>
            `;
        } else {
            amountDisplay = '🔒 [암호화됨]';
            flowDisplay = `
                <span>${crypto.shortenAddress(tx.fromAddress)}</span>
                <span class="arrow">→</span>
                <span>${crypto.shortenAddress(tx.toAddress)}</span>
            `;
        }

        const item = document.createElement('div');
        item.className = 'network-tx-item';
        item.onclick = () => openTxDetailModal(tx);
        item.innerHTML = `
            <div class="network-tx-header">
                <div class="network-tx-type">
                    <span class="icon">💸</span>
                    <span>Transfer</span>
                    ${isInvolved && state.currentRole === 'user' ? '<span style="color: var(--success-light); font-size: 10px;">(내 거래)</span>' : ''}
                </div>
                <span class="network-tx-time">${formatTime(new Date(tx.timestamp))}</span>
            </div>
            <div class="network-tx-flow">${flowDisplay}</div>
            <div class="network-tx-amount">${amountDisplay}</div>
        `;
        container.appendChild(item);
    });

    document.getElementById('networkLogCount').textContent = `${state.allTransactions.length}건`;
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

// Render participants
function renderParticipants() {
    const container = document.getElementById('participantList');
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
    renderAddressBookList();
    document.getElementById('addressBookModal').classList.add('active');
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
        card.className = 'node-card' + (node.required ? ' required' : '');
        card.dataset.id = node.id;
        card.innerHTML = `
            <div class="node-icon">${node.icon}</div>
            <div class="node-name">${node.name}</div>
            <div class="node-type">${node.type}</div>
            <div class="node-status ${node.required ? 'required' : ''}">${node.required ? '필수' : '대기'}</div>
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

// Update statistics (P0-5)
async function updateStats() {
    document.getElementById('chainLength').textContent = `${state.hashChain.length} 블록`;

    // Compute Merkle root from all hashes
    const allHashes = state.hashChain.map(block => block.hash);
    state.merkleRoot = await crypto.computeMerkleRoot(allHashes);
    document.getElementById('merkleRoot').textContent = state.merkleRoot.substring(0, 20) + '...';

    // Last verification
    if (state.lastVerification) {
        document.getElementById('lastVerified').textContent = formatTime(state.lastVerification.time);
    }
}

// Set quick amount
function setAmount(amount) {
    document.getElementById('sendAmount').value = amount.toLocaleString();
}

// Execute send (P0-2 전체 상태 변화 시각화)
async function executeSend() {
    if (state.currentRole !== 'user') {
        alert('사용자 역할에서만 송금이 가능합니다.');
        return;
    }

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

    // Store previous ciphertext for display
    const prevCiphertext = fromAccount.encryptedBalance.ciphertext;

    // Generate TX ID
    const txId = crypto.generateTxId();

    // Show processing modal with detailed steps
    showProcessingModal('FHE16 암호화 송금 처리 중', [
        { text: `TxID: ${txId} 생성`, status: 'active' },
        { text: '거래 데이터 암호화 (AES-256-GCM)', status: 'pending' },
        { text: '송신자 잔고 업데이트 (암호문 연산)', status: 'pending' },
        { text: '수신자 잔고 업데이트 (암호문 연산)', status: 'pending' },
        { text: '해시 체인 기록 + Merkle Root 갱신', status: 'pending' },
        { text: '네트워크 브로드캐스트', status: 'pending' }
    ]);

    // Step 1: Generate TxID
    await sleep(600);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    // Step 2: Encrypt transaction
    const txData = {
        txId: txId,
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

    await sleep(700);
    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    // Step 3: Update sender balance
    fromAccount.plainBalance -= amount;
    fromAccount.encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: fromAccount.plainBalance });

    await sleep(800);
    updateProcessingStep(2, 'done');
    updateProcessingStep(3, 'active');

    // Step 4: Update receiver balance
    toAccount.plainBalance += amount;
    toAccount.encryptedBalance = await crypto.encrypt(state.encryptionKey, { balance: toAccount.plainBalance });

    await sleep(700);
    updateProcessingStep(3, 'done');
    updateProcessingStep(4, 'active');

    // Step 5: Record to hash chain
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

    // Update Merkle root
    const allHashes = state.hashChain.map(block => block.hash);
    state.merkleRoot = await crypto.computeMerkleRoot(allHashes);

    await sleep(600);
    updateProcessingStep(4, 'done');
    updateProcessingStep(5, 'active');

    await sleep(400);
    updateProcessingStep(5, 'done');

    // Close modal and update UI
    await sleep(500);
    hideProcessingModal();

    // Show ciphertext change (P0-2)
    showCiphertextChange(prevCiphertext, fromAccount.encryptedBalance.ciphertext);

    // Show balance change animation
    showBalanceChange(-amount);

    updateViewForRole();
    updateStats();

    // Clear form
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendMemo').value = '';
    document.getElementById('toAddress').value = '';
    document.getElementById('addressPreview').style.display = 'none';
}

// Show ciphertext change (P0-2)
function showCiphertextChange(before, after) {
    const container = document.getElementById('ciphertextChange');
    document.getElementById('ciphertextBefore').textContent = '0x' + before.substring(0, 32) + '...';
    document.getElementById('ciphertextAfter').textContent = '0x' + after.substring(0, 32) + '...';
    container.style.display = 'block';

    // Auto hide after 10 seconds
    setTimeout(() => {
        container.style.display = 'none';
    }, 10000);
}

// Show balance change animation
function showBalanceChange(amount) {
    const changeEl = document.getElementById('balanceChange');
    changeEl.textContent = (amount > 0 ? '+' : '') + formatKRW(Math.abs(amount));
    changeEl.className = 'balance-change ' + (amount > 0 ? 'positive' : 'negative');

    setTimeout(() => {
        changeEl.textContent = '';
    }, 3000);
}

// Request disclosure (P0-3, P0-4)
async function requestDisclosure() {
    const targetId = document.getElementById('disclosureTarget').value;
    const reason = document.getElementById('disclosureReason').value;
    const scope = document.getElementById('disclosureScope').value;

    if (!targetId) {
        alert('열람 대상 주소를 선택해주세요.');
        return;
    }

    const targetAccount = state.accounts.find(a => a.id === targetId);
    const caseId = crypto.generateCaseId();
    const policy = approvalPolicies[reason];

    // Get disclosure options
    const disclosureOptions = {
        amount: document.getElementById('disclose_amount').checked,
        counterparty: document.getElementById('disclose_counterparty').checked,
        memo: document.getElementById('disclose_memo').checked
    };

    state.approvalState = {
        active: true,
        caseId: caseId,
        targetAccount: targetAccount,
        reason: reason,
        scope: scope,
        disclosureOptions: disclosureOptions,
        approvedNodes: [],
        policy: policy
    };

    // Add to cases list
    state.disclosureCases.push({
        caseId: caseId,
        targetAccount: targetAccount,
        reason: reason,
        scope: scope,
        disclosureOptions: disclosureOptions,
        status: 'pending',
        approvals: 0,
        createdAt: new Date()
    });

    updateDisclosureCases();
    openApprovalModal(targetAccount, reason, caseId, policy, scope, disclosureOptions);
}

// Update disclosure cases display
function updateDisclosureCases() {
    const container = document.getElementById('disclosureCases');
    const list = document.getElementById('casesList');

    if (state.disclosureCases.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    state.disclosureCases.forEach(c => {
        const progress = (c.approvals / 2) * 100;
        const item = document.createElement('div');
        item.className = 'case-item';
        item.innerHTML = `
            <div class="case-header">
                <span class="case-id">${c.caseId}</span>
                <span class="case-status ${c.status}">${c.status === 'pending' ? '승인 대기' : '완료'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary);">
                ${c.targetAccount.icon} ${c.targetAccount.name} - ${approvalPolicies[c.reason].name}
            </div>
            <div class="case-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${c.approvals}/2</span>
            </div>
        `;
        list.appendChild(item);
    });
}

// Open approval modal (P0-3 절차화)
function openApprovalModal(account, reason, caseId, policy, scope, disclosureOptions) {
    const modal = document.getElementById('approvalModal');
    const body = document.getElementById('approvalBody');

    const scopeText = {
        'balance_only': '현재 잔고만',
        'specific_tx': '특정 거래만',
        'period': '특정 기간',
        'all': '전체 내역'
    }[scope];

    const optionsText = [];
    if (disclosureOptions.amount) optionsText.push('금액');
    if (disclosureOptions.counterparty) optionsText.push('상대방');
    if (disclosureOptions.memo) optionsText.push('메모');

    body.innerHTML = `
        <div class="approval-case-id">
            <div class="case-id-label">사건번호 (Case ID)</div>
            <div class="case-id-value">${caseId}</div>
        </div>
        <div class="approval-info">
            <div class="approval-target">
                <span class="target-label">열람 대상</span>
                <span class="target-value">${account.icon} ${account.name}</span>
                <div style="font-size: 10px; color: var(--primary-light); margin-top: 4px; font-family: monospace;">${account.address}</div>
            </div>
            <div class="approval-reason">
                <span class="reason-label">요청 사유</span>
                <span class="reason-value">${policy.name}</span>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">범위: ${scopeText}</div>
            </div>
        </div>
        <div class="approval-policy">
            <div class="policy-title">역할 기반 승인 정책</div>
            <div class="policy-rule">${policy.rule}</div>
        </div>
        <div class="approval-threshold">
            <span>승인 임계값:</span>
            <strong>⌈6/3⌉ = ${policy.minApprovals}개 노드</strong>
        </div>
        <div class="approval-nodes">
            ${kmsNodes.map((node) => {
                const isRequired = node.required || policy.requiredCategories.includes(node.category);
                return `
                <div class="approval-node ${isRequired ? 'required' : ''}" data-node="${node.id}">
                    <div class="approval-node-info">
                        <span class="node-icon">${node.icon}</span>
                        <div>
                            <span class="node-name">${node.name}</span>
                            <span class="node-type">${node.type}</span>
                            ${isRequired ? '<span class="required-badge">필수</span>' : ''}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline approve-btn" onclick="approveNode('${node.id}')">
                        승인
                    </button>
                </div>
            `;
            }).join('')}
        </div>
        <div class="approval-progress">
            <span>승인 진행: <strong id="approvalCount">0</strong> / ${policy.minApprovals}</span>
        </div>
    `;

    modal.classList.add('active');
}

// Approve node (P0-3)
async function approveNode(nodeId) {
    if (state.approvalState.approvedNodes.includes(nodeId)) return;

    state.approvalState.approvedNodes.push(nodeId);

    // Update modal
    const nodeEl = document.querySelector(`.approval-node[data-node="${nodeId}"]`);
    nodeEl.classList.add('approved');
    nodeEl.classList.remove('required');
    nodeEl.querySelector('.approve-btn').textContent = '✓ 승인됨';
    nodeEl.querySelector('.approve-btn').disabled = true;

    const approvalCount = state.approvalState.approvedNodes.length;
    document.getElementById('approvalCount').textContent = approvalCount;

    // Update main nodes display
    const mainNodeEl = document.querySelector(`.node-card[data-id="${nodeId}"]`);
    if (mainNodeEl) {
        mainNodeEl.classList.add('approved');
        mainNodeEl.classList.remove('required');
        mainNodeEl.querySelector('.node-status').textContent = '승인';
        mainNodeEl.querySelector('.node-status').classList.add('approved');
        mainNodeEl.querySelector('.node-status').classList.remove('required');
    }

    // Update case in list
    const currentCase = state.disclosureCases.find(c => c.caseId === state.approvalState.caseId);
    if (currentCase) {
        currentCase.approvals = approvalCount;
        updateDisclosureCases();
    }

    // Check if threshold reached
    if (approvalCount >= state.approvalState.policy.minApprovals) {
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
        { text: '분산 키 조합 (2/6 임계값)', status: 'active' },
        { text: '데이터 복호화', status: 'pending' },
        { text: '범위 제한 적용', status: 'pending' },
        { text: '감사 로그 기록', status: 'pending' }
    ]);

    await sleep(800);
    updateProcessingStep(0, 'done');
    updateProcessingStep(1, 'active');

    await sleep(600);
    updateProcessingStep(1, 'done');
    updateProcessingStep(2, 'active');

    await sleep(500);
    updateProcessingStep(2, 'done');
    updateProcessingStep(3, 'active');

    // Record disclosure to hash chain
    const disclosureData = {
        type: 'DISCLOSURE',
        caseId: state.approvalState.caseId,
        targetAccount: state.approvalState.targetAccount.id,
        targetAddress: state.approvalState.targetAccount.address,
        reason: state.approvalState.reason,
        scope: state.approvalState.scope,
        disclosureOptions: state.approvalState.disclosureOptions,
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
    updateProcessingStep(3, 'done');

    await sleep(500);
    hideProcessingModal();

    // Update case status
    const currentCase = state.disclosureCases.find(c => c.caseId === state.approvalState.caseId);
    if (currentCase) {
        currentCase.status = 'approved';
        updateDisclosureCases();
    }

    // Show disclosure result with receipt (P0 체크리스트)
    showDisclosureResult(state.approvalState.targetAccount, disclosureHash);
    updateStats();

    // Update main display
    document.getElementById('nodesStatus').textContent = '승인 완료';
    document.getElementById('nodesStatus').className = 'nodes-status approved';

    // Reset approval state (keep for reference)
    const completedApproval = { ...state.approvalState };
    state.approvalState = {
        active: false,
        caseId: null,
        targetAccount: null,
        reason: null,
        scope: null,
        disclosureOptions: {},
        approvedNodes: [],
        policy: null
    };
}

// Show disclosure result with receipt
function showDisclosureResult(account, hash) {
    const container = document.getElementById('disclosureResult');
    const content = document.getElementById('disclosureContent');
    const receipt = document.getElementById('disclosureReceipt');

    const currentCase = state.disclosureCases.find(c => c.status === 'approved');
    const disclosureOpts = currentCase?.disclosureOptions || {};

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
                <span class="disclosed-value" style="font-size: 10px; font-family: monospace;">${account.address}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">계정 유형</span>
                <span class="disclosed-value">${account.type}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">현재 잔고</span>
                <span class="disclosed-value ${disclosureOpts.amount ? 'highlight' : 'masked'}">${disclosureOpts.amount ? formatKRWFull(account.plainBalance) : '*** 비공개 ***'}</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">거래 건수</span>
                <span class="disclosed-value">${accountTxs.length}건</span>
            </div>
            <div class="disclosed-item">
                <span class="disclosed-label">상대방 정보</span>
                <span class="disclosed-value ${disclosureOpts.counterparty ? '' : 'masked'}">${disclosureOpts.counterparty ? '공개됨' : '*** 비공개 ***'}</span>
            </div>
        </div>
    `;

    // Disclosure Receipt (P0 체크리스트 - 열람 영수증)
    receipt.innerHTML = `
        <div class="receipt-header">
            <span>📄</span>
            <span>열람 영수증 (Disclosure Receipt)</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">Case ID</span>
            <span class="receipt-value">${currentCase?.caseId || '-'}</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">요청 사유</span>
            <span class="receipt-value">${approvalPolicies[currentCase?.reason]?.name || '-'}</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">열람 범위</span>
            <span class="receipt-value">${currentCase?.scope || '-'}</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">승인 노드</span>
            <span class="receipt-value">${currentCase?.approvals || 0}/2</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">열람 시각</span>
            <span class="receipt-value">${formatFullDateTime(new Date())}</span>
        </div>
        <div class="receipt-item">
            <span class="receipt-label">승인 해시</span>
            <span class="receipt-value">${hash.substring(0, 16)}...</span>
        </div>
    `;

    container.style.display = 'block';
}

// Verify integrity (P0-5)
async function verifyIntegrity() {
    showProcessingModal('해시 체인 무결성 검증 중', [
        { text: '체인 연결성 검증', status: 'active' },
        { text: '해시 값 재계산', status: 'pending' },
        { text: 'Merkle Root 검증', status: 'pending' },
        { text: '검증 완료', status: 'pending' }
    ]);

    await sleep(800);
    let valid = true;
    let errorBlock = -1;

    // Verify chain linkage
    for (let i = 1; i < state.hashChain.length; i++) {
        if (state.hashChain[i].prevHash !== state.hashChain[i - 1].hash) {
            valid = false;
            errorBlock = i;
            break;
        }
    }

    updateProcessingStep(0, valid ? 'done' : 'active');
    updateProcessingStep(1, 'active');

    await sleep(800);

    // Verify hash calculations
    if (valid) {
        for (let i = 0; i < state.hashChain.length; i++) {
            const block = state.hashChain[i];
            const recalculated = await crypto.sha256(JSON.stringify(block.data) + block.prevHash);
            if (recalculated !== block.hash) {
                valid = false;
                errorBlock = i;
                break;
            }
        }
    }

    updateProcessingStep(1, valid ? 'done' : 'active');
    updateProcessingStep(2, 'active');

    await sleep(600);

    // Verify Merkle root
    const allHashes = state.hashChain.map(block => block.hash);
    const computedRoot = await crypto.computeMerkleRoot(allHashes);
    const merkleValid = computedRoot === state.merkleRoot;

    updateProcessingStep(2, merkleValid ? 'done' : 'active');
    updateProcessingStep(3, 'active');

    await sleep(400);
    updateProcessingStep(3, 'done');

    await sleep(500);
    hideProcessingModal();

    // Record verification
    state.lastVerification = {
        time: new Date(),
        valid: valid && merkleValid,
        blocksChecked: state.hashChain.length,
        merkleRoot: computedRoot
    };

    updateStats();

    // Show result
    showVerifyResult(valid && merkleValid, errorBlock, computedRoot);
}

// Show verification result (P0-5)
function showVerifyResult(valid, errorBlock, computedRoot) {
    const container = document.getElementById('verifyResult');
    container.style.display = 'block';

    if (valid) {
        container.className = 'verify-result success';
        container.innerHTML = `
            <div class="verify-result-header">
                <span style="color: var(--success-light);">✅ 검증 성공</span>
            </div>
            <div class="verify-result-detail">
                <div>• 검증 블록: ${state.hashChain.length}개</div>
                <div>• 체인 연결성: OK</div>
                <div>• 해시 무결성: OK</div>
                <div>• Merkle Root: ${computedRoot.substring(0, 24)}...</div>
                <div>• 검증 시각: ${formatFullDateTime(new Date())}</div>
            </div>
        `;
    } else {
        container.className = 'verify-result error';
        container.innerHTML = `
            <div class="verify-result-header">
                <span style="color: var(--danger-light);">⚠️ 검증 실패</span>
            </div>
            <div class="verify-result-detail">
                <div>• 오류 발생 블록: #${errorBlock}</div>
                <div>• 데이터 변조가 감지되었습니다</div>
            </div>
        `;
    }
}

// Open TX detail modal (P0-2)
function openTxDetailModal(tx) {
    const modal = document.getElementById('txDetailModal');
    const body = document.getElementById('txDetailBody');
    const roleConfig = getCurrentRoleConfig();
    const currentUser = getCurrentUser();
    const isInvolved = tx.from === currentUser.id || tx.to === currentUser.id;

    const fromAccount = state.accounts.find(a => a.id === tx.from);
    const toAccount = state.accounts.find(a => a.id === tx.to);

    // Determine what to show based on role
    const canSeeDetails = roleConfig.canSeeOwnTransactions && isInvolved;

    body.innerHTML = `
        <div class="tx-detail-section">
            <div class="tx-detail-title">거래 기본 정보</div>
            <div class="tx-detail-grid">
                <div class="tx-detail-item full">
                    <div class="tx-detail-label">Transaction ID</div>
                    <div class="tx-detail-value mono">${tx.txId}</div>
                </div>
                <div class="tx-detail-item">
                    <div class="tx-detail-label">거래 유형</div>
                    <div class="tx-detail-value">Transfer</div>
                </div>
                <div class="tx-detail-item">
                    <div class="tx-detail-label">타임스탬프</div>
                    <div class="tx-detail-value">${formatFullDateTime(new Date(tx.timestamp))}</div>
                </div>
            </div>
        </div>
        <div class="tx-detail-section">
            <div class="tx-detail-title">거래 당사자</div>
            <div class="tx-detail-grid">
                <div class="tx-detail-item">
                    <div class="tx-detail-label">송신자</div>
                    <div class="tx-detail-value ${canSeeDetails ? '' : 'mono'}">${canSeeDetails ? `${fromAccount.icon} ${fromAccount.name}` : crypto.shortenAddress(tx.fromAddress)}</div>
                </div>
                <div class="tx-detail-item">
                    <div class="tx-detail-label">수신자</div>
                    <div class="tx-detail-value ${canSeeDetails ? '' : 'mono'}">${canSeeDetails ? `${toAccount.icon} ${toAccount.name}` : crypto.shortenAddress(tx.toAddress)}</div>
                </div>
                <div class="tx-detail-item full">
                    <div class="tx-detail-label">금액</div>
                    <div class="tx-detail-value ${canSeeDetails ? 'success' : ''}">${canSeeDetails ? formatKRWFull(tx.amount) : '🔒 [암호화됨]'}</div>
                </div>
            </div>
        </div>
        <div class="tx-detail-section">
            <div class="tx-detail-title">암호화 정보</div>
            <div class="tx-detail-grid">
                <div class="tx-detail-item full">
                    <div class="tx-detail-label">Chain Hash</div>
                    <div class="tx-detail-value mono">${tx.chainHash}</div>
                </div>
                <div class="tx-detail-item full">
                    <div class="tx-detail-label">Encrypted Data (AES-256-GCM)</div>
                    <div class="tx-detail-value mono">${tx.encrypted?.ciphertext?.substring(0, 64) || '-'}...</div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Close TX detail modal
function closeTxDetailModal() {
    document.getElementById('txDetailModal').classList.remove('active');
}

// Open Key Recovery Modal (P1-7)
function openKeyRecoveryModal() {
    document.getElementById('keyRecoveryModal').classList.add('active');
}

// Close Key Recovery Modal
function closeKeyRecoveryModal() {
    document.getElementById('keyRecoveryModal').classList.remove('active');
}

// Reset demo
async function resetDemo() {
    // Reset state
    state = {
        encryptionKey: await crypto.generateKey(),
        currentUserId: 'user_1',
        currentRole: 'user',
        accounts: [],
        allTransactions: [],
        hashChain: [],
        merkleRoot: null,
        disclosureCases: [],
        approvalState: {
            active: false,
            caseId: null,
            targetAccount: null,
            reason: null,
            scope: null,
            disclosureOptions: {},
            approvedNodes: [],
            policy: null
        },
        lastVerification: null
    };

    // Reinitialize accounts
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

    state.merkleRoot = await crypto.computeMerkleRoot([genesisHash]);

    // Reset UI
    populateUserSwitcher();
    updateRoleBanner();
    updateViewForRole();
    renderParticipants();
    renderNodes();
    populateDisclosureSelect();
    updateStats();
    updateDisclosureCases();

    // Reset form
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendMemo').value = '';
    document.getElementById('toAddress').value = '';
    document.getElementById('addressPreview').style.display = 'none';

    // Reset disclosure
    document.getElementById('disclosureResult').style.display = 'none';
    document.getElementById('ciphertextChange').style.display = 'none';
    document.getElementById('verifyResult').style.display = 'none';

    // Reset nodes
    document.querySelectorAll('.node-card').forEach(node => {
        node.classList.remove('approving', 'approved');
        const nodeData = kmsNodes.find(n => n.id === node.dataset.id);
        if (nodeData?.required) {
            node.classList.add('required');
            node.querySelector('.node-status').textContent = '필수';
            node.querySelector('.node-status').classList.add('required');
        } else {
            node.querySelector('.node-status').textContent = '대기';
            node.querySelector('.node-status').classList.remove('required', 'approved');
        }
    });
    document.getElementById('nodesStatus').textContent = '대기 중';
    document.getElementById('nodesStatus').className = 'nodes-status';

    // Reset role tabs
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.role === 'user') {
            tab.classList.add('active');
        }
    });

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
