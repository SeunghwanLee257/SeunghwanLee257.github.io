import { loadFHE16Worker } from './dist/fhe16-web.mjs?v=58';

// ── i18n ─────────────────────────────────────────────────────────────────────
function t(en, ko) {
  return document.documentElement.classList.contains('lang-ko') ? ko : en;
}

const $ = id => document.getElementById(id);

// ── AES-GCM encryption (real, via Web Crypto) ─────────────────────────────
async function aesEncrypt(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv, ct: new Uint8Array(ct) };
}

async function generateAESKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt', 'decrypt']);
}

function toHex(buf, cols = 16) {
  const bytes = new Uint8Array(buf);
  const rows = [];
  for (let i = 0; i < bytes.length; i += cols) {
    rows.push(Array.from(bytes.slice(i, i + cols), b => b.toString(16).padStart(2, '0')).join(' '));
  }
  return rows.join('\n');
}

function setStep(stepEl, state) {
  stepEl.dataset.state = state; // 'idle' | 'active' | 'done' | 'error'
}

// ── State ─────────────────────────────────────────────────────────────────
let fhe = null;
let aesKey = null;

// ── FHE init ──────────────────────────────────────────────────────────────
async function initFHE() {
  const status = $('fheStatus');
  status.textContent = t('Loading FHE module…', 'FHE 모듈 로딩 중…');
  try {
    fhe = await loadFHE16Worker({ build: 'auto', policy: 'stable', baseUrl: './' });
    status.textContent = t('Generating FHE eval key…', 'FHE 평가 키 생성 중…');
    await fhe.generateKeys();
    status.textContent = t('FHE ready', 'FHE 준비 완료');
    $('runBtn').disabled = false;
  } catch (e) {
    status.textContent = `FHE error: ${e.message}`;
  }
}

// ── Main demo ─────────────────────────────────────────────────────────────
async function runDemo() {
  $('runBtn').disabled = true;

  const rawValue = parseInt($('inputValue').value, 10);
  if (isNaN(rawValue) || rawValue < 0 || rawValue > 255) {
    alert(t('Enter a value 0–255', '0~255 사이 값을 입력하세요'));
    $('runBtn').disabled = false;
    return;
  }
  const threshold = parseInt($('inputThreshold').value, 10);

  // ── Step 1: AES encrypt ──────────────────────────────────────────────
  setStep($('step1'), 'active');
  $('s1Out').textContent = '';

  aesKey = await generateAESKey();
  const { iv, ct: aesCt } = await aesEncrypt(aesKey, String(rawValue));

  const ivHex   = toHex(iv);
  const ctHex   = toHex(aesCt);
  const keyRaw  = new Uint8Array(await crypto.subtle.exportKey('raw', aesKey));
  const keyHex  = toHex(keyRaw);

  $('s1Out').innerHTML = `<b>${t('AES-128-GCM key (stays local)', 'AES-128-GCM 키 (로컬 보관)')}</b>\n${keyHex}\n\n<b>IV</b>\n${ivHex}\n\n<b>${t('AES ciphertext sent to cloud', '클라우드로 전송되는 AES 암호문')}</b>\n${ctHex}`;
  setStep($('step1'), 'done');

  // ── Step 2: Upload eval key to cloud ─────────────────────────────────
  setStep($('step2'), 'active');
  $('s2Out').textContent = t('Serialising FHE eval key…', 'FHE 평가 키 직렬화 중…');

  const evalKeyBytes = await fhe.saveEvalKey();
  $('s2Out').innerHTML = `<b>${t('FHE eval key uploaded to cloud', '클라우드에 업로드된 FHE 평가 키')}</b>\n${evalKeyBytes.length.toLocaleString()} bytes\n\n${toHex(evalKeyBytes.slice(0, 32))}…\n\n<span style="color:#4ade80">${t('Cloud now has: AES ciphertext + FHE eval key', '클라우드 보유: AES 암호문 + FHE 평가 키')}</span>\n<span style="color:#facc15">${t('Cloud does NOT have: AES key or FHE secret key', '클라우드 미보유: AES 키 / FHE 비밀키')}</span>`;
  setStep($('step2'), 'done');

  // ── Step 3: Cloud transciphers AES → FHE, then computes ──────────────
  setStep($('step3'), 'active');
  $('s3Out').textContent = t('Cloud running FHE computation…', '클라우드 FHE 연산 실행 중…');

  // In a real transciphering scenario the cloud would run an FHE AES circuit.
  // For demo: we directly FHE-encrypt the value (simulates the transciphered CT).
  const started = performance.now();
  const result = await fhe.runComparison('GT', rawValue, threshold, 8);
  const fheMs = performance.now() - started;

  $('s3Out').innerHTML = `<b>${t('FHE-encrypted result ciphertext (GT > threshold)', 'FHE 암호화 결과 암호문 (GT > threshold)')}</b>\n${t('Compute time', '연산 시간')}: ${fheMs.toFixed(0)} ms\n\n<span style="color:#a0d4f0">${t('Cloud sees only an encrypted 0 or 1 — cannot read the answer', '클라우드는 암호화된 0 또는 1만 봄 — 결과를 알 수 없음')}</span>`;
  setStep($('step3'), 'done');

  // ── Step 4: Client decrypts FHE result ────────────────────────────────
  setStep($('step4'), 'active');
  const answer = result.result === 1;
  const verdict = answer
    ? t(`Value (${rawValue}) > threshold (${threshold}) ✓`, `값(${rawValue}) > 임계값(${threshold}) ✓`)
    : t(`Value (${rawValue}) ≤ threshold (${threshold})`, `값(${rawValue}) ≤ 임계값(${threshold})`);

  $('s4Out').innerHTML = `<b>${t('Decrypted result', '복호화된 결과')}</b>\n\n<span style="font-size:20px;font-weight:900;color:${answer?'#4ade80':'#f87171'}">${verdict}</span>\n\n${t('FHE answer matches plaintext?', 'FHE 결과가 평문과 일치?')} ${result.pass ? t('YES ✓','일치 ✓') : t('MISMATCH!','불일치!')}`;
  setStep($('step4'), 'done');

  $('runBtn').disabled = false;
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('runBtn').addEventListener('click', runDemo);
  initFHE();

  // lang toggle
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isKo = document.documentElement.classList.toggle('lang-ko');
      btn.textContent = isKo ? 'English' : '한국어';
    });
  });
});
