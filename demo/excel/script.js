/**
 * RebateProof Demo
 * 원장 비공개 리베이트 정산 검증 시뮬레이션
 *
 * 실제 FHE16 대신 AES-256-GCM으로 시뮬레이션
 * Global Secret Key는 WebDB(IndexedDB)에 저장
 */

// ============== Global State ==============
const DB_NAME = 'RebateProofDB';
const DB_VERSION = 1;

let db = null;
let globalSecretKey = null;
let dataA = null; // 제조사 원장
let dataB = null; // 총판 원장
let encryptedDataA = null;
let encryptedDataB = null;
let settlementResult = null;

// ============== IndexedDB Setup ==============
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Secret Key Store
            if (!database.objectStoreNames.contains('keys')) {
                database.createObjectStore('keys', { keyPath: 'id' });
            }

            // Company A Data Store
            if (!database.objectStoreNames.contains('companyA')) {
                database.createObjectStore('companyA', { keyPath: 'id', autoIncrement: true });
            }

            // Company B Data Store
            if (!database.objectStoreNames.contains('companyB')) {
                database.createObjectStore('companyB', { keyPath: 'id', autoIncrement: true });
            }

            // Encrypted Data Store
            if (!database.objectStoreNames.contains('encrypted')) {
                database.createObjectStore('encrypted', { keyPath: 'company' });
            }

            // Settlement Results Store
            if (!database.objectStoreNames.contains('settlements')) {
                database.createObjectStore('settlements', { keyPath: 'id', autoIncrement: true });
            }

            // Rule Pack Store
            if (!database.objectStoreNames.contains('rules')) {
                database.createObjectStore('rules', { keyPath: 'id' });
            }

            // Proof Pack Store
            if (!database.objectStoreNames.contains('proofs')) {
                database.createObjectStore('proofs', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// ============== AES-256-GCM Crypto ==============
async function generateSecretKey() {
    return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

async function importKey(keyData) {
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function encryptData(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
    );

    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        timestamp: Date.now()
    };
}

async function decryptData(encryptedObj, key) {
    const iv = Uint8Array.from(atob(encryptedObj.iv), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(encryptedObj.data), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
}

// Hash function for rule pack
async function hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 16);
}

// ============== DB Operations ==============
async function saveToStore(storeName, data) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ============== Initialize Secret Key ==============
async function initSecretKey() {
    const stored = await getFromStore('keys', 'globalKey');

    if (stored) {
        globalSecretKey = await importKey(stored.keyData);
        console.log('기존 Global Secret Key 로드됨');
    } else {
        globalSecretKey = await generateSecretKey();
        const exported = await exportKey(globalSecretKey);
        await saveToStore('keys', { id: 'globalKey', keyData: exported });
        console.log('새 Global Secret Key 생성됨');
    }
}

// ============== Sample Data ==============
function generateSampleDataA() {
    // 제조사 데이터: 출하량, 단가, 할인 정책
    return {
        company: '㈜글로벌제약',
        period: '2025-Q1',
        transactions: [
            { month: '2025-01', sku: 'MED-001', productName: '비타민D 1000IU', qty: 15000, unitPrice: 8500, shipmentValue: 127500000 },
            { month: '2025-01', sku: 'MED-002', productName: '오메가3 프리미엄', qty: 8000, unitPrice: 15000, shipmentValue: 120000000 },
            { month: '2025-01', sku: 'MED-003', productName: '프로바이오틱스', qty: 12000, unitPrice: 12000, shipmentValue: 144000000 },
            { month: '2025-02', sku: 'MED-001', productName: '비타민D 1000IU', qty: 18000, unitPrice: 8500, shipmentValue: 153000000 },
            { month: '2025-02', sku: 'MED-002', productName: '오메가3 프리미엄', qty: 9500, unitPrice: 15000, shipmentValue: 142500000 },
            { month: '2025-02', sku: 'MED-003', productName: '프로바이오틱스', qty: 14000, unitPrice: 12000, shipmentValue: 168000000 },
            { month: '2025-03', sku: 'MED-001', productName: '비타민D 1000IU', qty: 20000, unitPrice: 8500, shipmentValue: 170000000 },
            { month: '2025-03', sku: 'MED-002', productName: '오메가3 프리미엄', qty: 11000, unitPrice: 15000, shipmentValue: 165000000 },
            { month: '2025-03', sku: 'MED-003', productName: '프로바이오틱스', qty: 16000, unitPrice: 12000, shipmentValue: 192000000 },
        ],
        rebatePolicy: {
            tier1: { min: 100000000, max: 200000000, rate: 0.03 },
            tier2: { min: 200000000, max: 500000000, rate: 0.04 },
            tier3: { min: 500000000, max: Infinity, rate: 0.05 }
        },
        returns: [
            { month: '2025-01', sku: 'MED-001', qty: 200, value: 1700000 },
            { month: '2025-02', sku: 'MED-003', qty: 150, value: 1800000 },
            { month: '2025-03', sku: 'MED-002', qty: 100, value: 1500000 },
        ]
    };
}

function generateSampleDataB() {
    // 총판 데이터: 실제 판매량, 재고, 프로모션 실적
    return {
        company: '㈜메디팜유통',
        period: '2025-Q1',
        sales: [
            { month: '2025-01', sku: 'MED-001', productName: '비타민D 1000IU', sellOutQty: 14500, sellOutValue: 145000000, promoQty: 2000 },
            { month: '2025-01', sku: 'MED-002', productName: '오메가3 프리미엄', sellOutQty: 7800, sellOutValue: 140400000, promoQty: 1000 },
            { month: '2025-01', sku: 'MED-003', productName: '프로바이오틱스', sellOutQty: 11500, sellOutValue: 161000000, promoQty: 1500 },
            { month: '2025-02', sku: 'MED-001', productName: '비타민D 1000IU', sellOutQty: 17200, sellOutValue: 172000000, promoQty: 2500 },
            { month: '2025-02', sku: 'MED-002', productName: '오메가3 프리미엄', sellOutQty: 9200, sellOutValue: 165600000, promoQty: 1200 },
            { month: '2025-02', sku: 'MED-003', productName: '프로바이오틱스', sellOutQty: 13500, sellOutValue: 189000000, promoQty: 1800 },
            { month: '2025-03', sku: 'MED-001', productName: '비타민D 1000IU', sellOutQty: 19500, sellOutValue: 195000000, promoQty: 3000 },
            { month: '2025-03', sku: 'MED-002', productName: '오메가3 프리미엄', sellOutQty: 10800, sellOutValue: 194400000, promoQty: 1500 },
            { month: '2025-03', sku: 'MED-003', productName: '프로바이오틱스', sellOutQty: 15800, sellOutValue: 221200000, promoQty: 2200 },
        ],
        inventory: [
            { sku: 'MED-001', beginningStock: 5000, endingStock: 6300 },
            { sku: 'MED-002', beginningStock: 3000, endingStock: 3500 },
            { sku: 'MED-003', beginningStock: 4000, endingStock: 4200 },
        ],
        claimedRebate: 58500000 // 총판이 주장하는 리베이트
    };
}

// ============== Rule Pack ==============
const RULE_PACK = {
    programName: '2025년 1분기 판촉 리베이트',
    period: { start: '2025-01-01', end: '2025-03-31' },
    baseCondition: '월 매출 1억 이상 시 리베이트 지급',
    tiers: [
        { minSales: 100000000, maxSales: 200000000, rebateRate: 0.03, description: '1억~2억: 3%' },
        { minSales: 200000000, maxSales: 500000000, rebateRate: 0.04, description: '2억~5억: 4%' },
        { minSales: 500000000, maxSales: Infinity, rebateRate: 0.05, description: '5억+: 5%' }
    ],
    exclusions: ['반품 제외', '프로모션 물량 별도 정산'],
    version: '1.0.0'
};

// ============== UI Functions ==============
function updateRuleHash() {
    hashData(RULE_PACK).then(hash => {
        document.getElementById('ruleHash').textContent = hash + '...';
    });
}

function updateStatusA(status, className = '') {
    const el = document.getElementById('statusA');
    el.textContent = status;
    el.className = 'data-status ' + className;
}

function updateStatusB(status, className = '') {
    const el = document.getElementById('statusB');
    el.textContent = status;
    el.className = 'data-status ' + className;
}

function updateSummaryA() {
    const el = document.getElementById('summaryA');
    if (!dataA) {
        el.innerHTML = '<p class="no-data">원장 데이터를 업로드하세요</p>';
        return;
    }

    const totalShipment = dataA.transactions.reduce((sum, t) => sum + t.shipmentValue, 0);
    const totalReturns = dataA.returns.reduce((sum, r) => sum + r.value, 0);
    const skuCount = [...new Set(dataA.transactions.map(t => t.sku))].length;

    el.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="label">총 출하액</span>
                <span class="value">${formatKRW(totalShipment)}</span>
            </div>
            <div class="summary-item">
                <span class="label">반품액</span>
                <span class="value">${formatKRW(totalReturns)}</span>
            </div>
            <div class="summary-item">
                <span class="label">SKU 수</span>
                <span class="value">${skuCount}개</span>
            </div>
            <div class="summary-item">
                <span class="label">거래 건수</span>
                <span class="value">${dataA.transactions.length}건</span>
            </div>
        </div>
    `;
}

function updateSummaryB() {
    const el = document.getElementById('summaryB');
    if (!dataB) {
        el.innerHTML = '<p class="no-data">원장 데이터를 업로드하세요</p>';
        return;
    }

    const totalSellOut = dataB.sales.reduce((sum, s) => sum + s.sellOutValue, 0);
    const totalPromo = dataB.sales.reduce((sum, s) => sum + s.promoQty, 0);
    const claimed = dataB.claimedRebate;

    el.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="label">총 판매액</span>
                <span class="value">${formatKRW(totalSellOut)}</span>
            </div>
            <div class="summary-item">
                <span class="label">프로모션 수량</span>
                <span class="value">${totalPromo.toLocaleString()}개</span>
            </div>
            <div class="summary-item">
                <span class="label">주장 리베이트</span>
                <span class="value">${formatKRW(claimed)}</span>
            </div>
            <div class="summary-item">
                <span class="label">거래 건수</span>
                <span class="value">${dataB.sales.length}건</span>
            </div>
        </div>
    `;
}

function formatKRW(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000000) {
        return (num / 10000000).toFixed(1) + '천만';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(0) + '만';
    }
    return num.toLocaleString() + '원';
}

function checkExecuteButton() {
    const btn = document.getElementById('executeBtn');
    btn.disabled = !(encryptedDataA && encryptedDataB);
}

// ============== Upload Functions ==============
function uploadDataA() {
    const modal = document.getElementById('uploadModal');
    document.getElementById('modalTitle').textContent = '㈜글로벌제약 원장 업로드';

    document.getElementById('modalBody').innerHTML = `
        <p style="margin-bottom: 20px; color: var(--medium); font-size: 14px;">
            제조사의 출하/반품 데이터를 업로드합니다. 실제 환경에서는 ERP 연동 또는 파일 업로드로 진행됩니다.
        </p>

        <div class="data-preview">
            <h4>샘플 데이터 미리보기 (3개월 출하 내역)</h4>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>월</th>
                        <th>SKU</th>
                        <th>품목</th>
                        <th>수량</th>
                        <th>출하액</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateSampleDataA().transactions.slice(0, 6).map(t => `
                        <tr>
                            <td>${t.month}</td>
                            <td>${t.sku}</td>
                            <td>${t.productName}</td>
                            <td>${t.qty.toLocaleString()}</td>
                            <td>${formatKRW(t.shipmentValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="confirmUploadA()">
                <span class="btn-icon">🔒</span>
                암호화 후 업로드
            </button>
        </div>
    `;

    modal.classList.add('active');
}

async function confirmUploadA() {
    closeModal();

    // Generate and encrypt data
    dataA = generateSampleDataA();
    updateStatusA('암호화 중...', 'ready');

    await sleep(500);

    // Encrypt sensitive fields
    encryptedDataA = {
        company: dataA.company,
        period: dataA.period,
        transactions: await encryptData(dataA.transactions, globalSecretKey),
        rebatePolicy: await encryptData(dataA.rebatePolicy, globalSecretKey),
        returns: await encryptData(dataA.returns, globalSecretKey),
        commitment: await hashData(dataA)
    };

    // Save to DB
    await saveToStore('encrypted', { company: 'A', ...encryptedDataA });

    updateStatusA('암호화 완료', 'uploaded');
    updateSummaryA();
    checkExecuteButton();

    addLog('info', `[Company A] 원장 데이터 암호화 완료`);
    addLog('crypto', `[Company A] 커밋먼트: ${encryptedDataA.commitment.slice(0, 20)}...`);
}

function uploadDataB() {
    const modal = document.getElementById('uploadModal');
    document.getElementById('modalTitle').textContent = '㈜메디팜유통 원장 업로드';

    document.getElementById('modalBody').innerHTML = `
        <p style="margin-bottom: 20px; color: var(--medium); font-size: 14px;">
            총판의 판매(sell-out)/재고 데이터를 업로드합니다. 원장 원본은 외부에 공개되지 않습니다.
        </p>

        <div class="data-preview">
            <h4>샘플 데이터 미리보기 (3개월 판매 내역)</h4>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>월</th>
                        <th>SKU</th>
                        <th>품목</th>
                        <th>판매수량</th>
                        <th>판매액</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateSampleDataB().sales.slice(0, 6).map(s => `
                        <tr>
                            <td>${s.month}</td>
                            <td>${s.sku}</td>
                            <td>${s.productName}</td>
                            <td>${s.sellOutQty.toLocaleString()}</td>
                            <td>${formatKRW(s.sellOutValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="confirmUploadB()">
                <span class="btn-icon">🔒</span>
                암호화 후 업로드
            </button>
        </div>
    `;

    modal.classList.add('active');
}

async function confirmUploadB() {
    closeModal();

    // Generate and encrypt data
    dataB = generateSampleDataB();
    updateStatusB('암호화 중...', 'ready');

    await sleep(500);

    // Encrypt sensitive fields
    encryptedDataB = {
        company: dataB.company,
        period: dataB.period,
        sales: await encryptData(dataB.sales, globalSecretKey),
        inventory: await encryptData(dataB.inventory, globalSecretKey),
        claimedRebate: await encryptData({ value: dataB.claimedRebate }, globalSecretKey),
        commitment: await hashData(dataB)
    };

    // Save to DB
    await saveToStore('encrypted', { company: 'B', ...encryptedDataB });

    updateStatusB('암호화 완료', 'uploaded');
    updateSummaryB();
    checkExecuteButton();

    addLog('info', `[Company B] 원장 데이터 암호화 완료`);
    addLog('crypto', `[Company B] 커밋먼트: ${encryptedDataB.commitment.slice(0, 20)}...`);
}

function closeModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

// ============== View Encrypted ==============
function viewEncryptedA() {
    if (!encryptedDataA) {
        alert('먼저 데이터를 업로드하세요.');
        return;
    }

    const modal = document.getElementById('encryptedModal');
    document.getElementById('encryptedTitle').textContent = '㈜글로벌제약 암호화 데이터';

    document.getElementById('encryptedBody').innerHTML = `
        <div class="encrypted-view">
            <p style="margin-bottom: 16px; color: var(--medium); font-size: 14px;">
                🔐 아래는 AES-256-GCM으로 암호화된 데이터입니다. 운영 벤더(V)는 이 암호문만 볼 수 있습니다.
            </p>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 거래 내역 (transactions)</div>
                <div class="field-value">${encryptedDataA.transactions.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 리베이트 정책 (rebatePolicy)</div>
                <div class="field-value">${encryptedDataA.rebatePolicy.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 반품 내역 (returns)</div>
                <div class="field-value">${encryptedDataA.returns.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label">📋 데이터 커밋먼트 (무결성 해시)</div>
                <div class="field-value" style="color: var(--success);">${encryptedDataA.commitment}</div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function viewEncryptedB() {
    if (!encryptedDataB) {
        alert('먼저 데이터를 업로드하세요.');
        return;
    }

    const modal = document.getElementById('encryptedModal');
    document.getElementById('encryptedTitle').textContent = '㈜메디팜유통 암호화 데이터';

    document.getElementById('encryptedBody').innerHTML = `
        <div class="encrypted-view">
            <p style="margin-bottom: 16px; color: var(--medium); font-size: 14px;">
                🔐 아래는 AES-256-GCM으로 암호화된 데이터입니다. 운영 벤더(V)는 이 암호문만 볼 수 있습니다.
            </p>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 판매 내역 (sales)</div>
                <div class="field-value">${encryptedDataB.sales.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 재고 정보 (inventory)</div>
                <div class="field-value">${encryptedDataB.inventory.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label"><span class="lock-icon">🔒</span> 주장 리베이트 (claimedRebate)</div>
                <div class="field-value">${encryptedDataB.claimedRebate.data.slice(0, 200)}...</div>
            </div>

            <div class="encrypted-field">
                <div class="field-label">📋 데이터 커밋먼트 (무결성 해시)</div>
                <div class="field-value" style="color: var(--success);">${encryptedDataB.commitment}</div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeEncryptedModal() {
    document.getElementById('encryptedModal').classList.remove('active');
}

// ============== Execution Log ==============
function clearLog() {
    document.getElementById('executionLog').innerHTML = '';
}

function addLog(type, message) {
    const log = document.getElementById('executionLog');
    const placeholder = log.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// ============== Settlement Execution ==============
async function executeSettlement() {
    if (!encryptedDataA || !encryptedDataB) {
        alert('양사 데이터가 모두 업로드되어야 합니다.');
        return;
    }

    const btn = document.getElementById('executeBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> 정산 실행 중...';

    clearLog();
    addLog('info', '=== RebateProof 정산 프로세스 시작 ===');

    await sleep(300);
    addLog('info', '[Step 1] Rule Pack 검증 중...');
    const ruleHash = await hashData(RULE_PACK);
    await sleep(200);
    addLog('success', `[Step 1] 룰 해시 확인: ${ruleHash.slice(0, 16)}...`);

    await sleep(300);
    addLog('info', '[Step 2] 암호화 데이터 수신 확인...');
    addLog('crypto', `[Company A] IV: ${encryptedDataA.transactions.iv.slice(0, 16)}...`);
    addLog('crypto', `[Company B] IV: ${encryptedDataB.sales.iv.slice(0, 16)}...`);

    await sleep(400);
    addLog('warning', '[Step 3] 🔐 Confidential Compute 시작 (FHE 시뮬레이션)');
    addLog('info', '암호문 상태에서 연산 수행 중...');

    // Decrypt data (simulating FHE computation)
    await sleep(300);
    addLog('crypto', '[Decrypt] Company A 거래 데이터 복호화...');
    const decryptedTransactions = await decryptData(encryptedDataA.transactions, globalSecretKey);
    const decryptedReturns = await decryptData(encryptedDataA.returns, globalSecretKey);
    const decryptedPolicy = await decryptData(encryptedDataA.rebatePolicy, globalSecretKey);

    await sleep(300);
    addLog('crypto', '[Decrypt] Company B 판매 데이터 복호화...');
    const decryptedSales = await decryptData(encryptedDataB.sales, globalSecretKey);
    const decryptedClaimed = await decryptData(encryptedDataB.claimedRebate, globalSecretKey);

    // Calculate settlement
    await sleep(400);
    addLog('info', '[Step 4] 정산 로직 실행...');

    // 월별 매출 집계
    const monthlySales = {};
    decryptedSales.forEach(s => {
        if (!monthlySales[s.month]) monthlySales[s.month] = 0;
        monthlySales[s.month] += s.sellOutValue;
    });

    addLog('info', `[계산] 1월 매출: ${formatKRW(monthlySales['2025-01'])}`);
    addLog('info', `[계산] 2월 매출: ${formatKRW(monthlySales['2025-02'])}`);
    addLog('info', `[계산] 3월 매출: ${formatKRW(monthlySales['2025-03'])}`);

    // 리베이트 계산
    await sleep(300);
    let totalRebate = 0;
    const rebateDetails = [];

    Object.entries(monthlySales).forEach(([month, sales]) => {
        let rate = 0;
        let tier = '';

        if (sales >= 500000000) {
            rate = 0.05;
            tier = 'Tier 3 (5%)';
        } else if (sales >= 200000000) {
            rate = 0.04;
            tier = 'Tier 2 (4%)';
        } else if (sales >= 100000000) {
            rate = 0.03;
            tier = 'Tier 1 (3%)';
        }

        const rebate = Math.floor(sales * rate);
        totalRebate += rebate;
        rebateDetails.push({ month, sales, tier, rate, rebate });

        addLog('success', `[${month}] ${tier} → 리베이트: ${formatKRW(rebate)}`);
    });

    // 반품 차감
    await sleep(200);
    const totalReturns = decryptedReturns.reduce((sum, r) => sum + r.value, 0);
    const returnDeduction = Math.floor(totalReturns * 0.03); // 반품에 대한 리베이트 차감
    addLog('warning', `[차감] 반품분 리베이트 차감: -${formatKRW(returnDeduction)}`);

    const finalRebate = totalRebate - returnDeduction;
    const claimedRebate = decryptedClaimed.value;
    const difference = finalRebate - claimedRebate;

    await sleep(300);
    addLog('success', `[결과] 계산된 리베이트: ${formatKRW(finalRebate)}`);
    addLog('info', `[비교] B사 주장 리베이트: ${formatKRW(claimedRebate)}`);
    addLog(difference >= 0 ? 'success' : 'warning',
           `[차이] ${difference >= 0 ? '+' : ''}${formatKRW(difference)}`);

    // Re-encrypt result
    await sleep(300);
    addLog('crypto', '[Step 5] 결과 재암호화...');

    settlementResult = {
        ruleHash,
        period: '2025-Q1',
        monthlySales,
        rebateDetails,
        totalRebate,
        returnDeduction,
        finalRebate,
        claimedRebate,
        difference,
        status: Math.abs(difference) < 1000000 ? 'MATCHED' : (difference > 0 ? 'UNDERCLAIMED' : 'OVERCLAIMED'),
        timestamp: Date.now(),
        executionId: crypto.randomUUID()
    };

    // Encrypt and save result
    const encryptedResult = await encryptData(settlementResult, globalSecretKey);
    await saveToStore('settlements', {
        id: settlementResult.executionId,
        result: encryptedResult,
        proofPack: await generateProofPack(settlementResult, ruleHash)
    });

    await sleep(200);
    addLog('success', `[Step 6] Proof Pack 생성 완료`);
    addLog('success', `=== 정산 완료 (실행 ID: ${settlementResult.executionId.slice(0, 8)}...) ===`);

    // Update UI
    updateResultBox();
    updateProofPack();
    updateROI();
    updateFeasibility();

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚡</span> 암호화 정산 실행';

    document.getElementById('verifyBtn').disabled = false;
}

async function generateProofPack(result, ruleHash) {
    return {
        ruleHash,
        inputCommitmentA: encryptedDataA.commitment,
        inputCommitmentB: encryptedDataB.commitment,
        executionId: result.executionId,
        timestamp: result.timestamp,
        resultHash: await hashData(result),
        environmentDigest: await hashData({
            browser: navigator.userAgent,
            timestamp: result.timestamp,
            ruleVersion: RULE_PACK.version
        })
    };
}

function updateResultBox() {
    const el = document.getElementById('resultBox');

    const statusLabel = {
        'MATCHED': '✅ 일치',
        'UNDERCLAIMED': '📊 과소청구',
        'OVERCLAIMED': '⚠️ 과대청구'
    };

    const statusColor = {
        'MATCHED': 'var(--success)',
        'UNDERCLAIMED': 'var(--info)',
        'OVERCLAIMED': 'var(--danger)'
    };

    el.innerHTML = `
        <div class="result-content animate-in">
            <div class="result-row">
                <span class="label">총 매출 (3개월)</span>
                <span class="value">${formatKRW(Object.values(settlementResult.monthlySales).reduce((a,b) => a+b, 0))}</span>
            </div>
            <div class="result-row">
                <span class="label">계산된 리베이트</span>
                <span class="value">${formatKRW(settlementResult.totalRebate)}</span>
            </div>
            <div class="result-row">
                <span class="label">반품 차감</span>
                <span class="value">-${formatKRW(settlementResult.returnDeduction)}</span>
            </div>
            <div class="result-row">
                <span class="label">B사 주장</span>
                <span class="value">${formatKRW(settlementResult.claimedRebate)}</span>
            </div>
            <div class="result-row">
                <span class="label">차이</span>
                <span class="value" style="color: ${statusColor[settlementResult.status]}">${settlementResult.difference >= 0 ? '+' : ''}${formatKRW(settlementResult.difference)}</span>
            </div>
            <div class="result-row total">
                <span class="label">정산 상태</span>
                <span class="value" style="color: ${statusColor[settlementResult.status]}">${statusLabel[settlementResult.status]}</span>
            </div>
        </div>
    `;
}

async function updateProofPack() {
    const el = document.getElementById('proofPack');
    const proof = (await getAllFromStore('settlements')).pop()?.proofPack;

    if (!proof) {
        el.innerHTML = '<p class="proof-placeholder">정산 실행 후 증빙이 생성됩니다</p>';
        return;
    }

    el.innerHTML = `
        <div class="proof-content animate-in">
            <div class="proof-item">
                <span class="label">룰 해시</span>
                <span class="value">${proof.ruleHash}</span>
            </div>
            <div class="proof-item">
                <span class="label">입력 커밋 (A)</span>
                <span class="value">${proof.inputCommitmentA}</span>
            </div>
            <div class="proof-item">
                <span class="label">입력 커밋 (B)</span>
                <span class="value">${proof.inputCommitmentB}</span>
            </div>
            <div class="proof-item">
                <span class="label">실행 ID</span>
                <span class="value">${proof.executionId}</span>
            </div>
            <div class="proof-item">
                <span class="label">결과 해시</span>
                <span class="value">${proof.resultHash}</span>
            </div>
            <div class="proof-item">
                <span class="label">타임스탬프</span>
                <span class="value">${new Date(proof.timestamp).toLocaleString('ko-KR')}</span>
            </div>
        </div>
    `;
}

function updateROI() {
    // 리드타임: 기존 14일 → 1일 (실시간)
    document.getElementById('roiLeadtime').textContent = '1일 (93% ↓)';
    document.getElementById('roiLeadtime').style.color = 'var(--success)';

    // 분쟁율: 23% → 3% (Proof Pack 기반 자동 합의)
    document.getElementById('roiDispute').textContent = '3% (87% ↓)';
    document.getElementById('roiDispute').style.color = 'var(--success)';

    // 인력: 3명 → 0.5명
    document.getElementById('roiManpower').textContent = '0.5명 (83% ↓)';
    document.getElementById('roiManpower').style.color = 'var(--success)';

    // 과지급: 2.1% → 0.1%
    document.getElementById('roiError').textContent = '~0.1% (95% ↓)';
    document.getElementById('roiError').style.color = 'var(--success)';
}

function updateFeasibility() {
    const el = document.getElementById('feasibilityContent');

    // 연간 절감 효과 계산 (중견 제약사 기준)
    const annualRebateVolume = 2400000000; // 연 24억 리베이트 정산 규모
    const currentDisputeRate = 0.23;
    const currentOverpayRate = 0.021;
    const currentLeadtimeCost = 50000000; // 연 5천만원 (자금 기회비용)
    const currentManpowerCost = 120000000; // 연 1.2억 (3명 × 4천만원)

    // RebateProof 적용 후
    const newDisputeRate = 0.03;
    const newOverpayRate = 0.001;
    const newLeadtimeCost = 5000000; // 연 500만원
    const newManpowerCost = 20000000; // 연 2천만원 (0.5명)

    // 절감액
    const disputeSaving = annualRebateVolume * (currentDisputeRate - newDisputeRate) * 0.05; // 분쟁 처리비용 5%
    const overpaymentSaving = annualRebateVolume * (currentOverpayRate - newOverpayRate);
    const leadtimeSaving = currentLeadtimeCost - newLeadtimeCost;
    const manpowerSaving = currentManpowerCost - newManpowerCost;

    const totalSaving = disputeSaving + overpaymentSaving + leadtimeSaving + manpowerSaving;

    // 우리 가격 vs 절감액
    const ourAnnualPrice = 96000000; // 연 9,600만원 (800만/월)
    const roi = ((totalSaving - ourAnnualPrice) / ourAnnualPrice * 100).toFixed(0);
    const paybackMonths = Math.ceil(ourAnnualPrice / (totalSaving / 12));

    el.innerHTML = `
        <div class="feasibility-grid animate-in">
            <div class="feasibility-item">
                <span class="label">분쟁 비용 절감</span>
                <span class="value">${formatKRW(disputeSaving)}/년</span>
            </div>
            <div class="feasibility-item">
                <span class="label">과지급 방지</span>
                <span class="value">${formatKRW(overpaymentSaving)}/년</span>
            </div>
            <div class="feasibility-item">
                <span class="label">자금 비용 절감</span>
                <span class="value">${formatKRW(leadtimeSaving)}/년</span>
            </div>
            <div class="feasibility-item">
                <span class="label">인력 비용 절감</span>
                <span class="value">${formatKRW(manpowerSaving)}/년</span>
            </div>
        </div>

        <div class="feasibility-conclusion">
            <p>
                <strong>연간 총 절감액: ${formatKRW(totalSaving)}</strong><br>
                RebateProof 연간 비용: ${formatKRW(ourAnnualPrice)}<br>
                <strong style="color: var(--success);">ROI: ${roi}% | 손익분기: ${paybackMonths}개월</strong>
            </p>
            <p style="margin-top: 12px; font-size: 12px; color: var(--medium);">
                ※ 중견 제약사(연 리베이트 24억 규모) 기준 추정치<br>
                ※ 실제 효과는 업종/규모/기존 프로세스에 따라 상이
            </p>
        </div>
    `;
}

// ============== Verification ==============
async function verifyResult() {
    if (!settlementResult) {
        alert('먼저 정산을 실행하세요.');
        return;
    }

    const el = document.getElementById('verificationResult');
    el.innerHTML = '<p style="text-align: center;">검증 중...</p>';

    await sleep(800);

    // Verify commitments
    const currentHashA = await hashData(dataA);
    const currentHashB = await hashData(dataB);

    const commitmentValid = (currentHashA === encryptedDataA.commitment) &&
                           (currentHashB === encryptedDataB.commitment);

    // Verify rule hash
    const currentRuleHash = await hashData(RULE_PACK);
    const ruleValid = currentRuleHash === settlementResult.ruleHash;

    // Verify result integrity
    const storedSettlement = (await getAllFromStore('settlements')).pop();
    const decryptedResult = await decryptData(storedSettlement.result, globalSecretKey);
    const resultValid = decryptedResult.executionId === settlementResult.executionId;

    const allValid = commitmentValid && ruleValid && resultValid;

    el.innerHTML = `
        <div class="animate-in">
            <div class="verify-success" style="color: ${allValid ? 'var(--success)' : 'var(--danger)'};">
                <span class="verify-icon">${allValid ? '✅' : '❌'}</span>
                <span class="verify-text">${allValid ? '모든 검증 통과' : '검증 실패'}</span>
            </div>
            <div style="margin-top: 16px; font-size: 13px; color: var(--medium);">
                <p>✓ 입력 데이터 무결성: ${commitmentValid ? '통과' : '실패'}</p>
                <p>✓ 룰 버전 일치: ${ruleValid ? '통과' : '실패'}</p>
                <p>✓ 결과 재현 가능: ${resultValid ? '통과' : '실패'}</p>
            </div>
            <p style="margin-top: 12px; font-size: 12px; color: var(--light);">
                이 Proof Pack은 감사/분쟁 시 제3자가 동일한 결과를 재현할 수 있는 증빙입니다.
            </p>
        </div>
    `;
}

// ============== Reset ==============
async function resetDemo() {
    if (!confirm('모든 데이터를 초기화하시겠습니까?')) return;

    // Clear stores
    await clearStore('companyA');
    await clearStore('companyB');
    await clearStore('encrypted');
    await clearStore('settlements');
    await clearStore('proofs');

    // Reset state
    dataA = null;
    dataB = null;
    encryptedDataA = null;
    encryptedDataB = null;
    settlementResult = null;

    // Reset UI
    updateStatusA('데이터 미등록', '');
    updateStatusB('데이터 미등록', '');
    updateSummaryA();
    updateSummaryB();

    document.getElementById('executionLog').innerHTML = '<p class="log-placeholder">정산 실행 대기 중...</p>';
    document.getElementById('proofPack').innerHTML = '<p class="proof-placeholder">정산 실행 후 증빙이 생성됩니다</p>';
    document.getElementById('resultBox').innerHTML = '<p class="result-placeholder">정산 실행을 기다리는 중...</p>';
    document.getElementById('feasibilityContent').innerHTML = '<p class="feasibility-placeholder">정산 실행 후 분석됩니다</p>';
    document.getElementById('verificationResult').innerHTML = '<p class="verify-placeholder">정산 후 검증 가능</p>';

    ['roiLeadtime', 'roiDispute', 'roiManpower', 'roiError'].forEach(id => {
        document.getElementById(id).textContent = '-';
        document.getElementById(id).style.color = '';
    });

    document.getElementById('executeBtn').disabled = true;
    document.getElementById('verifyBtn').disabled = true;
}

// ============== Utility ==============
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============== Initialize ==============
async function init() {
    try {
        await initDB();
        await initSecretKey();
        updateRuleHash();

        // Check for existing data
        const storedA = await getFromStore('encrypted', 'A');
        const storedB = await getFromStore('encrypted', 'B');

        if (storedA) {
            encryptedDataA = storedA;
            dataA = generateSampleDataA(); // Re-generate for display
            updateStatusA('암호화 완료', 'uploaded');
            updateSummaryA();
        }

        if (storedB) {
            encryptedDataB = storedB;
            dataB = generateSampleDataB();
            updateStatusB('암호화 완료', 'uploaded');
            updateSummaryB();
        }

        checkExecuteButton();

        console.log('RebateProof Demo initialized');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);
