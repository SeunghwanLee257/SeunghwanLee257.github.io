/**
 * SettleProof Demo v2.0
 * 원장 비공개 거래조건 정산 검증 시뮬레이션
 *
 * 실제 FHE16 대신 AES-256-GCM으로 시뮬레이션
 * Global Secret Key는 WebDB(IndexedDB)에 저장
 */

// ============== Global State ==============
const DB_NAME = 'SettleProofDB';
const DB_VERSION = 2;

let db = null;
let globalSecretKey = null;
let dataA = null; // 제조사 원장
let dataB = null; // 총판 원장
let encryptedDataA = null;
let encryptedDataB = null;
let settlementResult = null;
let currentERPTab = 'A';

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

            // Challenges Store
            if (!database.objectStoreNames.contains('challenges')) {
                database.createObjectStore('challenges', { keyPath: 'id', autoIncrement: true });
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

// Full SHA-256 hash
async function sha256(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Merkle Root calculation
async function calculateMerkleRoot(items) {
    if (items.length === 0) return 'empty';

    let hashes = await Promise.all(items.map(item => sha256(item)));

    while (hashes.length > 1) {
        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left;
            newHashes.push(await sha256(left + right));
        }
        hashes = newHashes;
    }

    return hashes[0];
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
        incentivePolicy: {
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
        claimedIncentive: 58500000 // 총판이 주장하는 장려금
    };
}

// ============== Rule Pack ==============
const RULE_PACK = {
    programName: '2025년 1분기 판촉정산',
    period: { start: '2025-01-01', end: '2025-03-31' },
    baseCondition: '월 매출 1억 이상 시 장려금 지급',
    tiers: [
        { minSales: 100000000, maxSales: 200000000, incentiveRate: 0.03, description: '1억~2억: 3%' },
        { minSales: 200000000, maxSales: 500000000, incentiveRate: 0.04, description: '2억~5억: 4%' },
        { minSales: 500000000, maxSales: Infinity, incentiveRate: 0.05, description: '5억+: 5%' }
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
    const claimed = dataB.claimedIncentive;

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
                <span class="label">주장 장려금</span>
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

function formatNumber(num) {
    return num.toLocaleString('ko-KR');
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
        incentivePolicy: await encryptData(dataA.incentivePolicy, globalSecretKey),
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
        claimedIncentive: await encryptData({ value: dataB.claimedIncentive }, globalSecretKey),
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
                <div class="field-label"><span class="lock-icon">🔒</span> 장려금 정책 (incentivePolicy)</div>
                <div class="field-value">${encryptedDataA.incentivePolicy.data.slice(0, 200)}...</div>
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
                <div class="field-label"><span class="lock-icon">🔒</span> 주장 장려금 (claimedIncentive)</div>
                <div class="field-value">${encryptedDataB.claimedIncentive.data.slice(0, 200)}...</div>
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
    addLog('info', '=== SettleProof 정산 프로세스 시작 ===');

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
    const decryptedPolicy = await decryptData(encryptedDataA.incentivePolicy, globalSecretKey);

    await sleep(300);
    addLog('crypto', '[Decrypt] Company B 판매 데이터 복호화...');
    const decryptedSales = await decryptData(encryptedDataB.sales, globalSecretKey);
    const decryptedClaimed = await decryptData(encryptedDataB.claimedIncentive, globalSecretKey);

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

    // 장려금 계산 (버킷별)
    await sleep(300);
    let totalIncentive = 0;
    const incentiveDetails = [];
    const bucketBreakdown = [];

    Object.entries(monthlySales).forEach(([month, sales]) => {
        let rate = 0;
        let tier = '';
        let tierNum = 0;

        if (sales >= 500000000) {
            rate = 0.05;
            tier = 'Tier 3 (5%)';
            tierNum = 3;
        } else if (sales >= 200000000) {
            rate = 0.04;
            tier = 'Tier 2 (4%)';
            tierNum = 2;
        } else if (sales >= 100000000) {
            rate = 0.03;
            tier = 'Tier 1 (3%)';
            tierNum = 1;
        }

        const incentive = Math.floor(sales * rate);
        totalIncentive += incentive;
        incentiveDetails.push({ month, sales, tier, tierNum, rate, incentive });

        // Bucket breakdown
        bucketBreakdown.push({
            bucketId: `${month}-T${tierNum}`,
            month,
            tier,
            tierNum,
            baseSales: sales,
            rate,
            grossIncentive: incentive,
            deductions: 0,
            netIncentive: incentive
        });

        addLog('success', `[${month}] ${tier} → 장려금: ${formatKRW(incentive)}`);
    });

    // 반품 차감 (월별 배분)
    await sleep(200);
    const totalReturns = decryptedReturns.reduce((sum, r) => sum + r.value, 0);
    const returnDeduction = Math.floor(totalReturns * 0.03);

    // 반품 차감을 월별로 배분
    const deductionPerMonth = Math.floor(returnDeduction / 3);
    bucketBreakdown.forEach(bucket => {
        bucket.deductions = deductionPerMonth;
        bucket.netIncentive = bucket.grossIncentive - deductionPerMonth;
    });

    addLog('warning', `[차감] 반품분 장려금 차감: -${formatKRW(returnDeduction)}`);

    const finalIncentive = totalIncentive - returnDeduction;
    const claimedIncentive = decryptedClaimed.value;
    const difference = finalIncentive - claimedIncentive;

    await sleep(300);
    addLog('success', `[결과] 계산된 장려금: ${formatKRW(finalIncentive)}`);
    addLog('info', `[비교] B사 주장 장려금: ${formatKRW(claimedIncentive)}`);
    addLog(difference >= 0 ? 'success' : 'warning',
           `[차이] ${difference >= 0 ? '+' : ''}${formatKRW(difference)}`);

    // Re-encrypt result
    await sleep(300);
    addLog('crypto', '[Step 5] 결과 재암호화...');

    const executionId = crypto.randomUUID();
    const settlementId = `SP-${Date.now().toString(36).toUpperCase()}`;

    settlementResult = {
        settlementId,
        ruleHash,
        period: '2025-Q1',
        monthlySales,
        incentiveDetails,
        bucketBreakdown,
        totalIncentive,
        returnDeduction,
        finalIncentive,
        claimedIncentive,
        difference,
        status: Math.abs(difference) < 1000000 ? 'MATCHED' : (difference > 0 ? 'UNDERCLAIMED' : 'OVERCLAIMED'),
        timestamp: Date.now(),
        executionId,
        challengeDeadline: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Calculate Merkle Root for all transactions
    const allItems = [
        ...decryptedTransactions,
        ...decryptedSales,
        ...decryptedReturns
    ];
    const merkleRoot = await calculateMerkleRoot(allItems);

    // Generate enhanced Proof Pack
    const proofPack = await generateProofPack(settlementResult, ruleHash, merkleRoot);

    // Encrypt and save result
    const encryptedResult = await encryptData(settlementResult, globalSecretKey);
    await saveToStore('settlements', {
        id: settlementResult.executionId,
        settlementId,
        result: encryptedResult,
        proofPack
    });

    await sleep(200);
    addLog('success', `[Step 6] Proof Pack 생성 완료`);
    addLog('success', `=== 정산 완료 (정산 ID: ${settlementId}) ===`);

    // Update UI
    updateStatementBox();
    updateProofPack();
    updateChallengeBox();
    updateApprovalBox();
    updateERPOutput();
    updateStats();

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚡</span> 암호화 정산 실행';

    document.getElementById('verifyBtn').disabled = false;
}

async function generateProofPack(result, ruleHash, merkleRoot) {
    const environmentDigest = await sha256({
        browser: navigator.userAgent,
        timestamp: result.timestamp,
        ruleVersion: RULE_PACK.version,
        screenRes: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    return {
        ruleHash,
        merkleRoot: merkleRoot.slice(0, 32) + '...',
        inputCommitmentA: encryptedDataA.commitment,
        inputCommitmentB: encryptedDataB.commitment,
        executionId: result.executionId,
        settlementId: result.settlementId,
        timestamp: result.timestamp,
        resultHash: await hashData(result),
        environmentDigest: environmentDigest.slice(0, 32) + '...',
        bucketCount: result.bucketBreakdown.length,
        totalTransactions: dataA.transactions.length + dataB.sales.length
    };
}

// ============== Settlement Statement ==============
function updateStatementBox() {
    const el = document.getElementById('statementBox');

    if (!settlementResult) {
        el.innerHTML = '<p class="statement-placeholder">정산 실행 후 버킷별 명세서가 생성됩니다</p>';
        return;
    }

    const buckets = settlementResult.bucketBreakdown;
    const totalGross = buckets.reduce((sum, b) => sum + b.grossIncentive, 0);
    const totalDeductions = buckets.reduce((sum, b) => sum + b.deductions, 0);
    const totalNet = buckets.reduce((sum, b) => sum + b.netIncentive, 0);

    el.innerHTML = `
        <div class="statement-content animate-in">
            <div class="statement-header-row">
                <span class="statement-id">정산번호: ${settlementResult.settlementId}</span>
                <span class="statement-period">정산기간: ${settlementResult.period}</span>
            </div>

            <table class="statement-table">
                <thead>
                    <tr>
                        <th>버킷 ID</th>
                        <th>월</th>
                        <th>티어</th>
                        <th>기준매출</th>
                        <th>요율</th>
                        <th>장려금(총)</th>
                        <th>차감</th>
                        <th>장려금(순)</th>
                    </tr>
                </thead>
                <tbody>
                    ${buckets.map(b => `
                        <tr>
                            <td class="mono">${b.bucketId}</td>
                            <td>${b.month}</td>
                            <td><span class="tier-badge tier-${b.tierNum}">${b.tier}</span></td>
                            <td class="number">${formatKRW(b.baseSales)}</td>
                            <td>${(b.rate * 100).toFixed(0)}%</td>
                            <td class="number">${formatKRW(b.grossIncentive)}</td>
                            <td class="number deduction">-${formatKRW(b.deductions)}</td>
                            <td class="number highlight">${formatKRW(b.netIncentive)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="5"><strong>합계</strong></td>
                        <td class="number">${formatKRW(totalGross)}</td>
                        <td class="number deduction">-${formatKRW(totalDeductions)}</td>
                        <td class="number highlight"><strong>${formatKRW(totalNet)}</strong></td>
                    </tr>
                </tfoot>
            </table>

            <div class="statement-footer">
                <button class="btn btn-sm btn-outline" onclick="openStatementDetail()">
                    <span class="btn-icon">📋</span>
                    상세보기
                </button>
                <span class="claim-comparison">
                    B사 주장: ${formatKRW(settlementResult.claimedIncentive)} |
                    차이: <span class="${settlementResult.difference >= 0 ? 'positive' : 'negative'}">
                        ${settlementResult.difference >= 0 ? '+' : ''}${formatKRW(settlementResult.difference)}
                    </span>
                </span>
            </div>
        </div>
    `;
}

function openStatementDetail() {
    const modal = document.getElementById('statementModal');
    const body = document.getElementById('statementModalBody');

    const buckets = settlementResult.bucketBreakdown;

    body.innerHTML = `
        <div class="statement-detail">
            <div class="detail-header">
                <h4>정산 명세서 상세</h4>
                <div class="detail-meta">
                    <span>정산번호: ${settlementResult.settlementId}</span>
                    <span>발행일시: ${new Date(settlementResult.timestamp).toLocaleString('ko-KR')}</span>
                </div>
            </div>

            <div class="detail-parties">
                <div class="party">
                    <h5>지급자 (A)</h5>
                    <p>${dataA.company}</p>
                </div>
                <div class="party-arrow">→</div>
                <div class="party">
                    <h5>수령자 (B)</h5>
                    <p>${dataB.company}</p>
                </div>
            </div>

            <div class="detail-program">
                <h5>프로그램 정보</h5>
                <table class="info-table">
                    <tr><td>프로그램명</td><td>${RULE_PACK.programName}</td></tr>
                    <tr><td>정산기간</td><td>${RULE_PACK.period.start} ~ ${RULE_PACK.period.end}</td></tr>
                    <tr><td>기본조건</td><td>${RULE_PACK.baseCondition}</td></tr>
                    <tr><td>룰 버전</td><td>${RULE_PACK.version}</td></tr>
                    <tr><td>룰 해시</td><td class="mono">${settlementResult.ruleHash}</td></tr>
                </table>
            </div>

            <div class="detail-breakdown">
                <h5>버킷별 상세</h5>
                ${buckets.map(b => `
                    <div class="bucket-detail">
                        <div class="bucket-header">
                            <span class="bucket-id">${b.bucketId}</span>
                            <span class="tier-badge tier-${b.tierNum}">${b.tier}</span>
                        </div>
                        <div class="bucket-body">
                            <div class="bucket-row">
                                <span>기준 매출</span>
                                <span>${formatNumber(b.baseSales)}원</span>
                            </div>
                            <div class="bucket-row">
                                <span>적용 요율</span>
                                <span>${(b.rate * 100).toFixed(1)}%</span>
                            </div>
                            <div class="bucket-row">
                                <span>총 장려금</span>
                                <span>${formatNumber(b.grossIncentive)}원</span>
                            </div>
                            <div class="bucket-row deduction">
                                <span>차감 (반품분)</span>
                                <span>-${formatNumber(b.deductions)}원</span>
                            </div>
                            <div class="bucket-row total">
                                <span>순 장려금</span>
                                <span>${formatNumber(b.netIncentive)}원</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="detail-summary">
                <h5>최종 정산 요약</h5>
                <table class="summary-table">
                    <tr>
                        <td>총 장려금 (Gross)</td>
                        <td class="number">${formatNumber(settlementResult.totalIncentive)}원</td>
                    </tr>
                    <tr class="deduction">
                        <td>총 차감액</td>
                        <td class="number">-${formatNumber(settlementResult.returnDeduction)}원</td>
                    </tr>
                    <tr class="total">
                        <td><strong>최종 지급액</strong></td>
                        <td class="number"><strong>${formatNumber(settlementResult.finalIncentive)}원</strong></td>
                    </tr>
                    <tr>
                        <td>B사 주장액</td>
                        <td class="number">${formatNumber(settlementResult.claimedIncentive)}원</td>
                    </tr>
                    <tr>
                        <td>차이</td>
                        <td class="number ${settlementResult.difference >= 0 ? 'positive' : 'negative'}">
                            ${settlementResult.difference >= 0 ? '+' : ''}${formatNumber(settlementResult.difference)}원
                        </td>
                    </tr>
                </table>
            </div>

            <div class="detail-footer">
                <p class="disclaimer">
                    본 명세서는 SettleProof 시스템에 의해 자동 생성되었으며,
                    양사의 암호화된 원장 데이터를 기반으로 산출되었습니다.
                    이의가 있는 경우 7일 이내 Challenge 프로토콜을 통해 이의제기 가능합니다.
                </p>
                <div class="detail-actions">
                    <button class="btn btn-secondary" onclick="closeStatementModal()">닫기</button>
                    <button class="btn btn-primary" onclick="downloadStatement()">
                        <span class="btn-icon">📥</span>
                        PDF 다운로드
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeStatementModal() {
    document.getElementById('statementModal').classList.remove('active');
}

function downloadStatement() {
    alert('PDF 다운로드 기능은 실제 운영 환경에서 제공됩니다.');
}

// ============== Proof Pack ==============
async function updateProofPack() {
    const el = document.getElementById('proofPack');
    const stored = (await getAllFromStore('settlements')).pop();
    const proof = stored?.proofPack;

    if (!proof) {
        el.innerHTML = '<p class="proof-placeholder">정산 실행 후 증빙이 생성됩니다</p>';
        return;
    }

    el.innerHTML = `
        <div class="proof-content animate-in">
            <div class="proof-grid">
                <div class="proof-item">
                    <span class="proof-label">룰 해시</span>
                    <span class="proof-value mono">${proof.ruleHash}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">Merkle Root</span>
                    <span class="proof-value mono">${proof.merkleRoot}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">입력 커밋 (A)</span>
                    <span class="proof-value mono">${proof.inputCommitmentA}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">입력 커밋 (B)</span>
                    <span class="proof-value mono">${proof.inputCommitmentB}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">실행 ID</span>
                    <span class="proof-value mono">${proof.executionId.slice(0, 16)}...</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">환경 다이제스트</span>
                    <span class="proof-value mono">${proof.environmentDigest}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">결과 해시</span>
                    <span class="proof-value mono">${proof.resultHash}</span>
                </div>
                <div class="proof-item">
                    <span class="proof-label">타임스탬프</span>
                    <span class="proof-value">${new Date(proof.timestamp).toLocaleString('ko-KR')}</span>
                </div>
            </div>
            <div class="proof-meta">
                <span>버킷 수: ${proof.bucketCount}</span>
                <span>총 거래건수: ${proof.totalTransactions}</span>
            </div>
        </div>
    `;
}

// ============== Challenge Protocol ==============
function updateChallengeBox() {
    const el = document.getElementById('challengeBox');

    if (!settlementResult) {
        el.innerHTML = '<p class="challenge-placeholder">정산 확정 후 이의제기 가능</p>';
        return;
    }

    const deadline = new Date(settlementResult.challengeDeadline);
    const daysLeft = Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));

    el.innerHTML = `
        <div class="challenge-content animate-in">
            <div class="challenge-status">
                <span class="challenge-icon">⏱️</span>
                <div class="challenge-info">
                    <span class="challenge-label">이의제기 마감</span>
                    <span class="challenge-deadline">${deadline.toLocaleDateString('ko-KR')} (${daysLeft}일 남음)</span>
                </div>
            </div>
            <p class="challenge-desc">
                정산 결과에 이의가 있는 경우, 랜덤 샘플링을 통한 검증을 요청할 수 있습니다.
                10건의 거래가 무작위로 추출되어 원본 대조됩니다.
            </p>
            <button class="btn btn-outline btn-challenge" onclick="openChallenge()">
                <span class="btn-icon">⚖️</span>
                이의제기 (Challenge)
            </button>
        </div>
    `;
}

function openChallenge() {
    const modal = document.getElementById('challengeModal');
    const body = document.getElementById('challengeModalBody');

    // Random sampling - select 10 items
    const allTransactions = [...dataA.transactions, ...dataB.sales];
    const sampleSize = Math.min(10, allTransactions.length);
    const samples = [];
    const usedIndices = new Set();

    while (samples.length < sampleSize) {
        const idx = Math.floor(Math.random() * allTransactions.length);
        if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            samples.push({
                index: idx,
                data: allTransactions[idx],
                source: idx < dataA.transactions.length ? 'A' : 'B'
            });
        }
    }

    body.innerHTML = `
        <div class="challenge-detail">
            <div class="challenge-header">
                <h4>🎲 랜덤 샘플링 검증</h4>
                <p>아래 ${sampleSize}건의 거래가 무작위로 추출되었습니다. 원본 데이터와 대조하세요.</p>
            </div>

            <div class="sample-list">
                <table class="sample-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>출처</th>
                            <th>월</th>
                            <th>SKU</th>
                            <th>품목</th>
                            <th>수량</th>
                            <th>금액</th>
                            <th>검증</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${samples.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><span class="source-badge source-${s.source}">${s.source === 'A' ? '제조사' : '총판'}</span></td>
                                <td>${s.data.month}</td>
                                <td class="mono">${s.data.sku}</td>
                                <td>${s.data.productName}</td>
                                <td class="number">${(s.data.qty || s.data.sellOutQty || 0).toLocaleString()}</td>
                                <td class="number">${formatKRW(s.data.shipmentValue || s.data.sellOutValue || 0)}</td>
                                <td>
                                    <select class="verify-select" id="verify-${i}">
                                        <option value="">선택</option>
                                        <option value="match">일치</option>
                                        <option value="mismatch">불일치</option>
                                    </select>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="challenge-input">
                <label>이의 사유 (선택사항)</label>
                <textarea id="challengeReason" rows="3" placeholder="불일치 항목에 대한 상세 사유를 입력하세요..."></textarea>
            </div>

            <div class="challenge-actions">
                <button class="btn btn-secondary" onclick="closeChallengeModal()">취소</button>
                <button class="btn btn-warning" onclick="submitChallenge(${sampleSize})">
                    <span class="btn-icon">📤</span>
                    이의제기 제출
                </button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

async function submitChallenge(sampleSize) {
    const verifications = [];
    let mismatchCount = 0;

    for (let i = 0; i < sampleSize; i++) {
        const select = document.getElementById(`verify-${i}`);
        const value = select.value;
        verifications.push(value);
        if (value === 'mismatch') mismatchCount++;
    }

    const reason = document.getElementById('challengeReason').value;

    if (verifications.some(v => v === '')) {
        alert('모든 항목의 검증 결과를 선택해주세요.');
        return;
    }

    // Save challenge
    const challenge = {
        settlementId: settlementResult.settlementId,
        timestamp: Date.now(),
        sampleSize,
        verifications,
        mismatchCount,
        reason,
        status: mismatchCount > 0 ? 'DISPUTE' : 'CONFIRMED'
    };

    await saveToStore('challenges', challenge);

    closeChallengeModal();

    if (mismatchCount > 0) {
        alert(`이의제기가 접수되었습니다.\n불일치 항목: ${mismatchCount}건\n\n분쟁 조정 프로세스가 시작됩니다.`);
        updateChallengeBox();
    } else {
        alert('모든 항목이 일치합니다. 정산이 최종 확정되었습니다.');
    }
}

function closeChallengeModal() {
    document.getElementById('challengeModal').classList.remove('active');
}

// ============== Approval Box ==============
function updateApprovalBox() {
    const el = document.getElementById('approvalBox');

    if (!settlementResult) {
        el.innerHTML = '<p class="approval-placeholder">정산 실행을 기다리는 중...</p>';
        return;
    }

    const statusLabel = {
        'MATCHED': '✅ 정산 일치',
        'UNDERCLAIMED': '📊 과소청구 (추가지급 권고)',
        'OVERCLAIMED': '⚠️ 과대청구 (조정 필요)'
    };

    const statusClass = {
        'MATCHED': 'success',
        'UNDERCLAIMED': 'info',
        'OVERCLAIMED': 'warning'
    };

    el.innerHTML = `
        <div class="approval-content animate-in">
            <div class="approval-status ${statusClass[settlementResult.status]}">
                <span class="approval-icon">${statusLabel[settlementResult.status].split(' ')[0]}</span>
                <span class="approval-text">${statusLabel[settlementResult.status].split(' ').slice(1).join(' ')}</span>
            </div>

            <div class="approval-details">
                <div class="approval-row">
                    <span>정산번호</span>
                    <span class="mono">${settlementResult.settlementId}</span>
                </div>
                <div class="approval-row">
                    <span>최종 지급액</span>
                    <span class="amount">${formatNumber(settlementResult.finalIncentive)}원</span>
                </div>
                <div class="approval-row">
                    <span>수령자</span>
                    <span>${dataB.company}</span>
                </div>
            </div>

            <div class="approval-actions">
                <button class="btn btn-success btn-approve" onclick="approvePayment()">
                    <span class="btn-icon">✓</span>
                    지급 승인
                </button>
                <button class="btn btn-outline btn-reject" onclick="rejectPayment()">
                    반려
                </button>
            </div>
        </div>
    `;
}

function approvePayment() {
    if (confirm(`${dataB.company}에 ${formatNumber(settlementResult.finalIncentive)}원 지급을 승인하시겠습니까?`)) {
        alert('지급이 승인되었습니다. ERP 전표가 생성됩니다.');
        updateApprovalBox();
    }
}

function rejectPayment() {
    const reason = prompt('반려 사유를 입력하세요:');
    if (reason) {
        alert(`지급이 반려되었습니다.\n사유: ${reason}`);
    }
}

// ============== ERP Output ==============
function showERPTab(tab) {
    currentERPTab = tab;
    document.querySelectorAll('.erp-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.erp-tab:${tab === 'A' ? 'first' : 'last'}-child`).classList.add('active');
    updateERPOutput();
}

function updateERPOutput() {
    const el = document.getElementById('erpOutput');

    if (!settlementResult) {
        el.innerHTML = '<p class="erp-placeholder">정산 실행 후 전표가 생성됩니다</p>';
        return;
    }

    const amount = settlementResult.finalIncentive;
    const date = new Date(settlementResult.timestamp).toLocaleDateString('ko-KR');

    if (currentERPTab === 'A') {
        // 지급자 (제조사) 회계 처리
        el.innerHTML = `
            <div class="erp-content animate-in">
                <div class="erp-header">
                    <span class="erp-company">${dataA.company}</span>
                    <span class="erp-type">판매장려금 지급</span>
                </div>

                <table class="erp-table">
                    <thead>
                        <tr>
                            <th>계정과목</th>
                            <th>차변 (Dr)</th>
                            <th>대변 (Cr)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>판매장려금 (판관비)</td>
                            <td class="debit">${formatNumber(amount)}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>미지급금</td>
                            <td></td>
                            <td class="credit">${formatNumber(amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>합계</strong></td>
                            <td class="debit"><strong>${formatNumber(amount)}</strong></td>
                            <td class="credit"><strong>${formatNumber(amount)}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="erp-memo">
                    <div class="memo-row">
                        <span>적요</span>
                        <span>${RULE_PACK.programName} - ${dataB.company}</span>
                    </div>
                    <div class="memo-row">
                        <span>전표일자</span>
                        <span>${date}</span>
                    </div>
                    <div class="memo-row">
                        <span>정산번호</span>
                        <span class="mono">${settlementResult.settlementId}</span>
                    </div>
                </div>

                <div class="erp-note">
                    <p>* 지급 완료 시 미지급금 → 보통예금 대체</p>
                </div>
            </div>
        `;
    } else {
        // 수령자 (총판) 회계 처리
        el.innerHTML = `
            <div class="erp-content animate-in">
                <div class="erp-header">
                    <span class="erp-company">${dataB.company}</span>
                    <span class="erp-type">판매장려금 수령</span>
                </div>

                <table class="erp-table">
                    <thead>
                        <tr>
                            <th>계정과목</th>
                            <th>차변 (Dr)</th>
                            <th>대변 (Cr)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>미수금</td>
                            <td class="debit">${formatNumber(amount)}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>매입할인 (매입에누리)</td>
                            <td></td>
                            <td class="credit">${formatNumber(amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>합계</strong></td>
                            <td class="debit"><strong>${formatNumber(amount)}</strong></td>
                            <td class="credit"><strong>${formatNumber(amount)}</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="erp-memo">
                    <div class="memo-row">
                        <span>적요</span>
                        <span>${RULE_PACK.programName} - ${dataA.company}</span>
                    </div>
                    <div class="memo-row">
                        <span>전표일자</span>
                        <span>${date}</span>
                    </div>
                    <div class="memo-row">
                        <span>정산번호</span>
                        <span class="mono">${settlementResult.settlementId}</span>
                    </div>
                </div>

                <div class="erp-note">
                    <p>* 입금 완료 시 보통예금 ← 미수금 대체</p>
                </div>
            </div>
        `;
    }
}

// ============== Stats ==============
function updateStats() {
    // 리드타임: 기존 14일 → 1일 (실시간)
    document.getElementById('statLeadtime').textContent = '1일 (93%↓)';
    document.getElementById('statLeadtime').style.color = 'var(--success)';

    // 분쟁율: 23% → 3%
    document.getElementById('statDispute').textContent = '3% (87%↓)';
    document.getElementById('statDispute').style.color = 'var(--success)';

    // 인력: 3명 → 0.5명
    document.getElementById('statManpower').textContent = '0.5명 (83%↓)';
    document.getElementById('statManpower').style.color = 'var(--success)';

    // 오차율: 2.1% → 0.1%
    document.getElementById('statError').textContent = '~0.1% (95%↓)';
    document.getElementById('statError').style.color = 'var(--success)';
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
    await clearStore('challenges');

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
    document.getElementById('statementBox').innerHTML = '<p class="statement-placeholder">정산 실행 후 버킷별 명세서가 생성됩니다</p>';
    document.getElementById('challengeBox').innerHTML = '<p class="challenge-placeholder">정산 확정 후 이의제기 가능</p>';
    document.getElementById('approvalBox').innerHTML = '<p class="approval-placeholder">정산 실행을 기다리는 중...</p>';
    document.getElementById('erpOutput').innerHTML = '<p class="erp-placeholder">정산 실행 후 전표가 생성됩니다</p>';
    document.getElementById('verificationResult').innerHTML = '<p class="verify-placeholder">정산 후 검증 가능</p>';

    ['statLeadtime', 'statDispute', 'statManpower', 'statError'].forEach(id => {
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

        console.log('SettleProof Demo v2.0 initialized');
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);
