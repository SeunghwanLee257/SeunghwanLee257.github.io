/**
 * STO Privacy Execution Layer Demo Application
 */

// State management
const state = {
    totalChecks: 0,
    allowedTx: 0,
    deniedTx: 0,
    latencies: [],
    evidenceRecords: [],
    blocks: [],
    dvpExecuted: false
};

// Simulated investor database
const investorDB = {
    'INV-2025-001': {
        annualIncome: 80000000,
        totalAssets: 300000000,
        investmentLimit: 100000000,
        currentHolding: 30000000,
        kycStatus: 'VERIFIED',
        kycExpiry: '2026-12-31',
        accreditedInvestor: false
    },
    'INV-2025-002': {
        annualIncome: 150000000,
        totalAssets: 800000000,
        investmentLimit: 500000000,
        currentHolding: 100000000,
        kycStatus: 'VERIFIED',
        kycExpiry: '2026-06-30',
        accreditedInvestor: true
    },
    'INV-2025-003': {
        annualIncome: 25000000,
        totalAssets: 50000000,
        investmentLimit: 20000000,
        currentHolding: 15000000,
        kycStatus: 'PENDING',
        kycExpiry: '2025-01-01',
        accreditedInvestor: false
    }
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize crypto engine
    await cryptoEngine.initialize();

    // Setup tab navigation
    setupTabs();

    // Update stats display
    updateStats();

    // Show encrypted sensitive data preview
    updateEncryptedPreview();
});

// Tab navigation
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Update stats display
function updateStats() {
    document.getElementById('totalChecks').textContent = state.totalChecks;
    document.getElementById('allowedTx').textContent = state.allowedTx;
    document.getElementById('deniedTx').textContent = state.deniedTx;

    const avgLatency = state.latencies.length > 0
        ? Math.round(state.latencies.reduce((a, b) => a + b, 0) / state.latencies.length)
        : 0;
    document.getElementById('avgLatency').innerHTML = `${avgLatency}<small>ms</small>`;

    document.getElementById('evidenceCount').textContent = state.evidenceRecords.length;
}

// Update encrypted preview
async function updateEncryptedPreview() {
    const investorId = document.getElementById('investorId').value;
    const investor = investorDB[investorId] || investorDB['INV-2025-001'];

    // Encrypt each field
    const encIncome = await cryptoEngine.encrypt({ value: investor.annualIncome });
    const encAssets = await cryptoEngine.encrypt({ value: investor.totalAssets });
    const encLimit = await cryptoEngine.encrypt({ value: investor.investmentLimit });
    const encKyc = await cryptoEngine.encrypt({ value: investor.kycStatus });

    // Display truncated encrypted values
    document.getElementById('encIncome').textContent = encIncome.substring(0, 16) + '...';
    document.getElementById('encAssets').textContent = encAssets.substring(0, 16) + '...';
    document.getElementById('encLimit').textContent = encLimit.substring(0, 16) + '...';
    document.getElementById('encKyc').textContent = encKyc.substring(0, 16) + '...';
}

// Execute pre-trade check
async function executePreTradeCheck() {
    const startTime = performance.now();

    // Get form values
    const investorId = document.getElementById('investorId').value;
    const tokenType = document.getElementById('tokenType').value;
    const txAmount = parseInt(document.getElementById('txAmount').value) || 0;
    const txType = document.querySelector('input[name="txType"]:checked').value;

    // Get investor data
    const investor = investorDB[investorId] || investorDB['INV-2025-001'];

    // Reset steps
    resetSteps();

    // Step 1: Encrypt data
    await animateStep('step1', async () => {
        const encryptedData = await cryptoEngine.encrypt(investor);
        document.getElementById('encryptedData').textContent = encryptedData;
        return encryptedData;
    });

    // Step 2: Execute policy (decrypt -> compute -> encrypt)
    let finalResult;
    await animateStep('step2', async () => {
        const encryptedData = await cryptoEngine.encrypt(investor);

        // Check investment limit
        const limitResult = await cryptoEngine.computeOnEncrypted(encryptedData, 'checkLimit', {
            requestedAmount: txAmount
        });

        // Check KYC
        const kycResult = await cryptoEngine.computeOnEncrypted(encryptedData, 'checkKYC', {});

        // Check eligibility
        const eligibilityResult = await cryptoEngine.computeOnEncrypted(encryptedData, 'checkEligibility', {
            tokenType,
            requestedAmount: txAmount
        });

        // Combine results
        const allowed = limitResult.plainResult.allowed &&
            kycResult.plainResult.allowed &&
            eligibilityResult.plainResult.allowed;

        let reason = 'All checks passed';
        if (!allowed) {
            const reasons = [];
            if (!limitResult.plainResult.allowed) reasons.push(limitResult.plainResult.reason);
            if (!kycResult.plainResult.allowed) reasons.push(kycResult.plainResult.reason);
            if (!eligibilityResult.plainResult.allowed) reasons.push(eligibilityResult.plainResult.reason);
            reason = reasons.join('; ');
        }

        finalResult = { allowed, reason };
        return finalResult;
    });

    // Step 3: Sign result
    let signature;
    await animateStep('step3', async () => {
        signature = await cryptoEngine.generateSignature({
            investorId,
            tokenType,
            txAmount,
            txType,
            result: finalResult
        });
        return signature;
    });

    // Step 4: Create evidence trail
    const evidence = await animateStep('step4', async () => {
        const inputHash = await cryptoEngine.generateHash({ investorId, tokenType, txAmount, txType });
        const timestamp = new Date().toISOString();

        const record = {
            id: `TX-${Date.now().toString(36).toUpperCase()}`,
            timestamp,
            investorId,
            decision: finalResult.allowed ? 'ALLOWED' : 'DENIED',
            policyVersion: 'v2.3.1-2025-01',
            inputHash,
            signature
        };

        state.evidenceRecords.unshift(record);
        return record;
    });

    // Calculate latency
    const latency = Math.round(performance.now() - startTime);
    state.latencies.push(latency);

    // Update stats
    state.totalChecks++;
    if (finalResult.allowed) {
        state.allowedTx++;
    } else {
        state.deniedTx++;
    }
    updateStats();

    // Show result
    showResult(finalResult, latency, evidence);

    // Update evidence table
    updateEvidenceTable();

    // Add block to blockchain
    addBlock(evidence);
}

// Animate execution step
async function animateStep(stepId, action) {
    const step = document.getElementById(stepId);
    step.classList.add('active');

    // Simulate processing time
    await sleep(300 + Math.random() * 200);

    const result = await action();

    step.classList.remove('active');
    step.classList.add('completed');

    return result;
}

// Reset all steps
function resetSteps() {
    ['step1', 'step2', 'step3', 'step4'].forEach(id => {
        const step = document.getElementById(id);
        step.classList.remove('active', 'completed', 'error');
    });
    document.getElementById('encryptedData').textContent = 'Processing...';
}

// Show result
function showResult(result, latency, evidence) {
    const resultDisplay = document.getElementById('resultDisplay');
    const evidencePreview = document.getElementById('evidencePreview');

    resultDisplay.innerHTML = `
        <div class="result-card ${result.allowed ? 'allowed' : 'denied'}">
            <div class="result-icon">
                ${result.allowed
            ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        }
            </div>
            <div class="result-status">${result.allowed ? 'ALLOWED' : 'DENIED'}</div>
            <div class="result-reason">${result.reason}</div>
            <div class="result-latency">Processing time: <strong>${latency}ms</strong></div>
        </div>
    `;

    // Show evidence preview
    evidencePreview.style.display = 'block';
    document.getElementById('evPolicyVer').textContent = evidence.policyVersion;
    document.getElementById('evInputHash').textContent = evidence.inputHash;
    document.getElementById('evResultSig').textContent = evidence.signature;
    document.getElementById('evTimestamp').textContent = evidence.timestamp;
}

// Update evidence table
function updateEvidenceTable() {
    const tbody = document.getElementById('evidenceTableBody');

    if (state.evidenceRecords.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">No evidence records yet. Execute a pre-trade check to generate records.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = state.evidenceRecords.map(record => `
        <tr>
            <td class="mono" style="font-size: 11px;">${record.timestamp}</td>
            <td class="mono" style="color: var(--accent-orange);">${record.id}</td>
            <td>${record.investorId}</td>
            <td><span class="decision-badge ${record.decision.toLowerCase()}">${record.decision}</span></td>
            <td class="mono" style="font-size: 11px;">${record.policyVersion}</td>
            <td class="mono" style="font-size: 10px; color: var(--text-muted);">${record.signature}</td>
        </tr>
    `).join('');
}

// Add block to blockchain
async function addBlock(evidence) {
    const chain = document.getElementById('blockchainChain');

    const prevHash = state.blocks.length > 0
        ? state.blocks[state.blocks.length - 1].hash
        : '0x0000...0000';

    const blockData = {
        index: state.blocks.length + 1,
        timestamp: evidence.timestamp,
        data: evidence,
        prevHash
    };

    const hash = await cryptoEngine.generateHash(blockData);
    blockData.hash = hash;
    state.blocks.push(blockData);

    // Add connector
    const connector = document.createElement('div');
    connector.className = 'block-connector';
    chain.appendChild(connector);

    // Add block
    const block = document.createElement('div');
    block.className = 'block';
    block.innerHTML = `
        <div class="block-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
        </div>
        <span class="block-label">Block #${blockData.index}</span>
        <span class="block-hash">${hash}</span>
        <div class="block-data">${evidence.id} | ${evidence.decision}</div>
    `;
    chain.appendChild(block);

    // Scroll to new block
    chain.scrollLeft = chain.scrollWidth;
}

// Execute DvP settlement
async function executeDvP() {
    const dvpResult = document.getElementById('dvpResult');

    dvpResult.innerHTML = `
        <div style="text-align: center;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2" class="spin">
                <circle cx="12" cy="12" r="10" stroke-dasharray="30" stroke-dashoffset="10"></circle>
            </svg>
            <p style="margin-top: 12px; color: var(--text-secondary);">Executing atomic settlement...</p>
        </div>
    `;

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`;
    document.head.appendChild(style);

    // Simulate settlement steps
    await sleep(500);

    // Step 1: Lock assets
    dvpResult.innerHTML = `
        <div style="text-align: center;">
            <p style="color: var(--accent-orange); font-weight: 600;">Step 1/3: Locking assets...</p>
        </div>
    `;
    await sleep(700);

    // Step 2: Verify compliance
    dvpResult.innerHTML = `
        <div style="text-align: center;">
            <p style="color: var(--accent-orange); font-weight: 600;">Step 2/3: Verifying compliance...</p>
        </div>
    `;
    await sleep(700);

    // Step 3: Atomic swap
    dvpResult.innerHTML = `
        <div style="text-align: center;">
            <p style="color: var(--accent-orange); font-weight: 600;">Step 3/3: Executing atomic swap...</p>
        </div>
    `;
    await sleep(700);

    // Update balances
    document.getElementById('buyerBalance').textContent = '0 USDC';
    document.getElementById('sellerBalance').textContent = '0 STO-A';

    // Show success
    const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);

    dvpResult.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 64px; height: 64px; background: var(--accent-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <p style="font-size: 20px; font-weight: 700; color: var(--accent-green); margin-bottom: 8px;">Settlement Complete!</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">Atomic DvP executed successfully</p>
            <div style="background: var(--bg-card); padding: 12px; border-radius: 8px;">
                <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Transaction Hash</p>
                <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--accent-orange); word-break: break-all;">${txHash}</p>
            </div>
        </div>
    `;

    // Add evidence record for DvP
    const evidence = {
        id: `DVP-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        investorId: 'DVP-SETTLEMENT',
        decision: 'ALLOWED',
        policyVersion: 'v2.3.1-2025-01',
        inputHash: await cryptoEngine.generateHash({ type: 'DvP', txHash }),
        signature: await cryptoEngine.generateSignature({ type: 'DvP', txHash })
    };

    state.evidenceRecords.unshift(evidence);
    state.totalChecks++;
    state.allowedTx++;
    updateStats();
    updateEvidenceTable();
    addBlock(evidence);
}

// Reset demo
function resetDemo() {
    // Reset state
    state.totalChecks = 0;
    state.allowedTx = 0;
    state.deniedTx = 0;
    state.latencies = [];
    state.evidenceRecords = [];
    state.blocks = [];

    // Reset UI
    updateStats();
    updateEvidenceTable();

    // Reset blockchain
    document.getElementById('blockchainChain').innerHTML = `
        <div class="genesis-block">
            <div class="block-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            </div>
            <span class="block-label">Genesis Block</span>
            <span class="block-hash">0x0000...0000</span>
        </div>
    `;

    // Reset result display
    document.getElementById('resultDisplay').innerHTML = `
        <div class="result-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Execute a pre-trade check to see results</span>
        </div>
    `;
    document.getElementById('evidencePreview').style.display = 'none';

    // Reset DvP
    document.getElementById('buyerBalance').textContent = '100,000 USDC';
    document.getElementById('sellerBalance').textContent = '1,000 STO-A';
    document.getElementById('dvpResult').innerHTML = `
        <div class="result-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="16 12 12 8 8 12"></polyline>
                <line x1="12" y1="16" x2="12" y2="8"></line>
            </svg>
            <span>Click "Execute Settlement" to simulate atomic DvP</span>
        </div>
    `;

    // Reset steps
    resetSteps();
    document.getElementById('encryptedData').textContent = 'Waiting for execution...';

    // Regenerate crypto key
    cryptoEngine.initialize();
    updateEncryptedPreview();
}

// Utility function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Add event listener for investor ID change
document.getElementById('investorId')?.addEventListener('change', updateEncryptedPreview);
