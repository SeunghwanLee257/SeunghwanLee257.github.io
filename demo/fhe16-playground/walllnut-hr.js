import { availableFHE16Builds, loadFHE16Worker } from './dist/fhe16-web.mjs?v=58';

// ── Elements ────────────────────────────────────────────────────────────────
const el = (id) => document.getElementById(id);
const buildSelect     = el('buildSelect');
const loadButton      = el('loadButton');
const keygenButton    = el('keygenButton');
const statusText      = el('statusText');
const logOutput       = el('logOutput');
const hrSubmitBtn     = el('hrSubmitBtn');
const creditSubmitBtn = el('creditSubmitBtn');
const edrSubmitBtn    = el('edrSubmitBtn');

let fhe = null;
let busy = false;
let currentScenario = 'hr';
let runningScenario = 'hr';

// ── i18n helper ──────────────────────────────────────────────────────────────
function t(en, ko) {
  return document.documentElement.classList.contains('lang-ko') ? ko : en;
}

// ── Logging ──────────────────────────────────────────────────────────────────
function log(msg) {
  const t = new Date().toLocaleTimeString();
  logOutput.textContent += `[${t}] ${msg}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}
function setStatus(text) { statusText.textContent = text; }

// ── Build select ─────────────────────────────────────────────────────────────
buildSelect.innerHTML = [
  '<option value="auto">Auto Stable</option>',
  '<option value="auto-fastest">Auto Fastest</option>',
  ...availableFHE16Builds().map((b) => `<option value="${b.name}">${b.label}</option>`),
].join('');

// ── Step helpers ─────────────────────────────────────────────────────────────
const PFX = { hr: 'hr', credit: 'cr', edr: 'edr' };

function resetSteps(scenario) {
  const p = PFX[scenario];
  for (let n = 1; n <= 8; n++) {
    const c = el(`${p}C-${n}`);
    const s = el(`${p}S-${n}`);
    if (c) { c.className = 'step-circle'; c.textContent = String(n); }
    if (s) { s.className = 'step-status waiting'; s.textContent = t('Waiting', '대기'); }
  }
}

function activateStep(n, scenario) {
  const p = PFX[scenario];
  if (n > 1) {
    const pc = el(`${p}C-${n - 1}`);
    const ps = el(`${p}S-${n - 1}`);
    if (pc) { pc.className = 'step-circle done'; pc.textContent = '✓'; }
    if (ps) { ps.className = 'step-status done'; ps.textContent = '✓'; }
  }
  const c = el(`${p}C-${n}`);
  const s = el(`${p}S-${n}`);
  if (c) { c.className = 'step-circle active'; }
  if (s) { s.className = 'step-status active'; s.textContent = t('Running…', '진행 중…'); }
}

function markAllDone(scenario) {
  const p = PFX[scenario];
  for (let n = 1; n <= 8; n++) {
    const c = el(`${p}C-${n}`);
    const s = el(`${p}S-${n}`);
    if (c) { c.className = 'step-circle done'; c.textContent = '✓'; }
    if (s) { s.className = 'step-status done'; s.textContent = '✓'; }
  }
}

// ── Scenario switcher ────────────────────────────────────────────────────────
document.querySelectorAll('.scenario-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (busy) return;
    currentScenario = btn.dataset.scenario;
    document.querySelectorAll('.scenario-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.scenario-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    el(`panel-${currentScenario}`).classList.add('active');
  });
});

// ── EDR toggle checked class sync ────────────────────────────────────────────
document.querySelectorAll('.edr-toggle input[type="checkbox"]').forEach((cb) => {
  cb.addEventListener('change', () => {
    cb.closest('.edr-toggle').classList.toggle('checked', cb.checked);
  });
});

// ── Enable submit buttons when keys are ready ────────────────────────────────
function setSubmitsEnabled(enabled) {
  hrSubmitBtn.disabled     = !enabled;
  creditSubmitBtn.disabled = !enabled;
  edrSubmitBtn.disabled    = !enabled;
}

// ── Module loading ───────────────────────────────────────────────────────────
async function loadModule() {
  if (fhe || busy) return;
  busy = true;
  loadButton.disabled = true;
  buildSelect.disabled = true;
  setSubmitsEnabled(false);
  setStatus(t('Loading module…', '모듈 로딩 중…'));
  log(t('Loading FHE16 WASM module…', 'FHE16 WASM 모듈 로딩 시작…'));

  try {
    const build = buildSelect.value;
    fhe = await loadFHE16Worker({
      build:  build === 'auto-fastest' ? 'auto' : build,
      policy: build === 'auto-fastest' ? 'fastest' : 'stable',
      baseUrl: './',
      includeCiphertextBytes: true,
      onLog: (msg) => {
        if (msg.startsWith('STEP:')) {
          const n = parseInt(msg.split(':')[1], 10);
          if (!isNaN(n)) activateStep(n, runningScenario);
        }
        log(msg);
      },
      onStatus: (t) => log(`status: ${t}`),
    });
    setStatus(t('Module loaded — generating keys…', '모듈 로드 완료 — 키 생성 중…'));
    log(`Loaded ${fhe.version} / ${fhe.metadata.label}`);
    await generateKeys();
  } catch (e) {
    fhe = null;
    busy = false;
    loadButton.disabled = false;
    buildSelect.disabled = false;
    setStatus(t('Load failed', '로드 실패'));
    log(`ERROR: ${e.message}`);
  }
}

async function generateKeys() {
  if (!fhe || fhe.keysReady) return;
  setStatus(t('Generating eval key… (takes a few seconds)', '평가 키 생성 중… (수 초 소요)'));
  log(t('FHE16_GenEval starting…', 'FHE16_GenEval 시작…'));
  try {
    const ms = await fhe.generateKeys();
    setStatus(t('Ready — select a scenario and submit', '준비 완료 — 시나리오를 선택하고 제출하세요'));
    log(t(`Eval key generated: ${ms.toFixed(0)} ms`, `평가 키 생성 완료: ${ms.toFixed(0)} ms`));
    setSubmitsEnabled(true);
    keygenButton.disabled = true;
  } catch (e) {
    setStatus(t('Key generation failed', '키 생성 실패'));
    log(`ERROR: ${e.message}`);
    keygenButton.disabled = false;
  } finally {
    busy = false;
    loadButton.disabled = true;
    buildSelect.disabled = true;
  }
}

// ── Elapsed timer helper ──────────────────────────────────────────────────────
function startElapsedTimer(elId) {
  const badge = el(elId);
  const t0 = performance.now();
  badge.textContent = t('0s', '0초');
  badge.className = 'elapsed-badge';
  const iv = setInterval(() => {
    const s = ((performance.now() - t0) / 1000).toFixed(0);
    badge.textContent = t(`${s}s`, `${s}초`);
  }, 500);
  return () => {
    clearInterval(iv);
    const total = ((performance.now() - t0) / 1000).toFixed(1);
    badge.textContent = t(`done ${total}s`, `완료 ${total}초`);
    badge.className = 'elapsed-badge done';
  };
}

// ── HR submit ─────────────────────────────────────────────────────────────────
el('hrForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;

  const scores = [];
  for (let i = 0; i < 5; i++) {
    const sel = el('hrForm').querySelector(`input[name="q${i}"]:checked`);
    if (!sel) { setStatus(t('Please answer all questions', '모든 문항에 답해 주세요')); return; }
    scores.push(parseInt(sel.value, 10));
  }

  busy = true;
  setSubmitsEnabled(false);
  runningScenario = 'hr';

  const progress = el('hrProgress');
  const result   = el('hrResult');
  progress.style.display = 'block';
  result.style.display = 'none';
  result.className = 'result-panel';
  const hrCC = el('hrCipherCard'); if (hrCC) hrCC.style.display = 'none';
  resetSteps('hr');
  progress.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(t('FHE computing…', 'FHE 연산 중…'));
  log(t(`HR screening submitted: scores=[${scores.join(',')}]`, `HR 심사 제출: scores=[${scores.join(',')}]`));

  const stopTimer = startElapsedTimer('hrElapsed');
  try {
    const r = await fhe.runHRScreen(scores);
    stopTimer();
    markAllDone('hr');
    showResult('hr', r.pass, r.computeMs, r.pass
      ? t('Passed hiring screening. In production, the server holds the policy and criteria; the browser receives only the result bit.',
          '채용 심사를 통과하였습니다. 실서비스에서는 서버가 policy와 기준값을 보관하고, 브라우저는 결과 bit만 받습니다.')
      : t('Did not meet this round\'s criteria. In production, exact criteria and rule packs never leave the server.',
          '이번 심사 기준에 충족하지 못했습니다. 실서비스에서는 정확한 기준값과 rule pack이 서버 밖으로 나가지 않습니다.'));
    showCipherCard('hr',
      t(`Education:${scores[0]} Exp:${scores[1]} Tech:${scores[2]} Comm:${scores[3]} Team:${scores[4]}`,
        `학력: ${scores[0]}점\n경력: ${scores[1]}점\n기술: ${scores[2]}점\n소통: ${scores[3]}점\n팀워크: ${scores[4]}점`),
      r.pass, r.ctBytes, r.ctInputs, r.ctIntermed, r.ctFinal);
    log(t(`HR done: ${r.pass ? 'PASS' : 'FAIL'} (${r.computeMs.toFixed(1)} ms)`,
          `HR 완료: ${r.pass ? '합격' : '불합격'} (${r.computeMs.toFixed(1)} ms)`));
    setStatus(t(r.pass ? 'Pass' : 'Fail', r.pass ? '합격' : '불합격'));
  } catch (e) {
    stopTimer();
    markAllDone('hr');
    setStatus(t('Computation error', '연산 오류'));
    log(`ERROR: ${e.message}`);
  } finally {
    busy = false;
    setSubmitsEnabled(true);
  }
});

// ── Bucket → representative raw amount mapping ────────────────────────────────
const INCOME_BKT_VALS = [0,   50, 150, 250, 350, 450, 550]; // 万원
const DEBT_BKT_VALS   = [0,   20,  60,  90, 125, 175, 250]; // 万원
const EMP_BKT_VALS    = [0,    1,   2,   4,   6];            // 년

// ── Credit submit ─────────────────────────────────────────────────────────────
el('creditForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;

  const income_bkt = parseInt(el('creditIncomeBkt').value, 10);
  const debt_bkt   = parseInt(el('creditDebtBkt').value,   10);
  const emp_bkt    = parseInt(el('creditEmpBkt').value,    10);

  const income = INCOME_BKT_VALS[income_bkt];
  const debt   = DEBT_BKT_VALS[debt_bkt];
  const years  = EMP_BKT_VALS[emp_bkt];

  busy = true;
  setSubmitsEnabled(false);
  runningScenario = 'credit';

  const progress = el('crProgress');
  const result   = el('crResult');
  progress.style.display = 'block';
  result.style.display = 'none';
  result.className = 'result-panel';
  const crCC = el('crCipherCard'); if (crCC) crCC.style.display = 'none';
  resetSteps('credit');
  progress.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(t('FHE computing…', 'FHE 연산 중…'));
  log(t(`Prequalification submitted: income_bkt=${income_bkt}(≈${income}), debt_bkt=${debt_bkt}(≈${debt}), emp_bkt=${emp_bkt}(≈${years}yr)`,
        `사전 심사 제출: 소득구간=${income_bkt}(≈${income}만), 부채구간=${debt_bkt}(≈${debt}만), 재직구간=${emp_bkt}(≈${years}년)`));

  const stopTimer = startElapsedTimer('crElapsed');
  try {
    const r = await fhe.runCreditCheck(income, debt, years);
    stopTimer();
    markAllDone('credit');

    const detail = r.approved
      ? t('Passed prequalification. In production, income/debt thresholds and limit criteria are server-only.',
          '사전 심사를 통과하였습니다. 실서비스에서는 소득/부채 threshold와 한도 기준은 서버만 알고 있습니다.')
      : t('Did not meet prequalification criteria. Exact thresholds and limit criteria never leave the server.',
          '이번 사전 심사 기준에 충족하지 못했습니다. 정확한 threshold와 한도 기준은 서버 밖으로 나가지 않습니다.');
    showResult('cr', r.approved, r.computeMs, detail);

    // 한도 등급 표시
    const limitDiv = el('crLimitBucket');
    const limitVal = el('crLimitBucketVal');
    if (r.approved && r.limitBucket) {
      limitVal.textContent = r.limitBucket === 'A'
        ? t('Grade A (Premium)', 'A등급 (프리미엄)')
        : t('Grade B (Standard)', 'B등급 (일반)');
      limitDiv.style.display = 'block';
    } else {
      limitDiv.style.display = 'none';
    }

    showCipherCard('cr',
      t(`Income:≈${income}M / Debt:≈${debt}M / Employment:≈${years}yr`,
        `월 소득: ≈${income}만원\n월 부채: ≈${debt}만원\n재직기간: ≈${years}년`),
      r.approved, r.ctBytes, r.ctInputs, r.ctIntermed, r.ctFinal);
    log(t(`Prequalification done: ${r.approved ? 'PASS' : 'FAIL'} limit=${r.limitBucket ?? '-'} (${r.computeMs.toFixed(1)} ms)`,
          `사전 심사 완료: ${r.approved ? '통과' : '미통과'} 한도등급=${r.limitBucket ?? '-'} (${r.computeMs.toFixed(1)} ms)`));
    setStatus(t(r.approved ? 'Pass' : 'Fail', r.approved ? '통과' : '미통과'));
  } catch (e) {
    stopTimer();
    markAllDone('credit');
    setStatus(t('Computation error', '연산 오류'));
    log(`ERROR: ${e.message}`);
  } finally {
    busy = false;
    setSubmitsEnabled(true);
  }
});

// ── EDR submit ────────────────────────────────────────────────────────────────
el('edrForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;

  const form = el('edrForm');
  const features = {
    unsignedBinary:      form.querySelector('input[name="unsignedBinary"]').checked,
    rareParent:          form.querySelector('input[name="rareParent"]').checked,
    suspiciousOutbound:  form.querySelector('input[name="suspiciousOutbound"]').checked,
    privilegeEscalation: form.querySelector('input[name="privilegeEscalation"]').checked,
    scriptSpawn:         form.querySelector('input[name="scriptSpawn"]').checked,
    sensitivePath:       form.querySelector('input[name="sensitivePath"]').checked,
  };
  const countBkt = parseInt(el('edrCountBkt').value, 10);

  busy = true;
  setSubmitsEnabled(false);
  runningScenario = 'edr';

  const progress = el('edrProgress');
  const result   = el('edrResult');
  progress.style.display = 'block';
  result.style.display = 'none';
  result.className = 'result-panel';
  const edrCC = el('edrCipherCard'); if (edrCC) edrCC.style.display = 'none';
  resetSteps('edr');
  progress.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setStatus(t('FHE computing…', 'FHE 연산 중…'));

  const flagNames = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
  log(t(`EDR detection submitted: features=[${flagNames.join(',')}] countBkt=${countBkt}`,
        `EDR 탐지 제출: features=[${flagNames.join(',')}] countBkt=${countBkt}`));

  const stopTimer = startElapsedTimer('edrElapsed');
  try {
    const r = await fhe.runEDRCheck({ ...features, eventCountBucket: countBkt });
    stopTimer();
    markAllDone('edr');
    showEDRResult(r);
    const flagLine = Object.entries(features)
      .map(([k, v]) => `${k}: ${v ? '✓' : '✗'}`).join('\n');
    showCipherCard('edr', `${flagLine}\ncountBkt: ${countBkt}`, r.alert, r.ctBytes, r.ctInputs, r.ctIntermed, r.ctFinal);
    log(t(`EDR done: ${r.alert ? 'ALERT' : 'CLEAN'} severity=${r.severity} family=${r.family} (${r.computeMs.toFixed(1)} ms)`,
          `EDR 완료: ${r.alert ? '탐지' : '정상'} severity=${r.severity} family=${r.family} (${r.computeMs.toFixed(1)} ms)`));
    setStatus(t(r.alert ? 'Threat detected' : 'Clean', r.alert ? '위협 탐지' : '정상'));
  } catch (e) {
    stopTimer();
    markAllDone('edr');
    setStatus(t('Computation error', '연산 오류'));
    log(`ERROR: ${e.message}`);
  } finally {
    busy = false;
    setSubmitsEnabled(true);
  }
});

// ── Ciphertext helpers ────────────────────────────────────────────────────────
function downloadBytes(filename, bytes) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

function ctBytesToHexFull(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const rows = [];
  for (let i = 0; i < view.length; i += 16) {
    rows.push(Array.from(view.slice(i, i + 16), b => b.toString(16).padStart(2, '0')).join(' '));
  }
  return rows.join('\n');
}

function buildCtCard(label, bytes, dlFilename) {
  const div = document.createElement('div');
  div.className = 'ct-insp-card';
  const sizeStr = bytes ? `${bytes.length} bytes` : 'n/a';
  const header = document.createElement('div');
  header.className = 'ct-insp-header';
  header.innerHTML =
    `<span class="ct-insp-name">${label}</span>` +
    `<span class="ct-insp-size">${sizeStr}</span>`;
  div.appendChild(header);
  if (bytes) {
    const dlBtn = document.createElement('button');
    dlBtn.className = 'ct-dl-btn';
    dlBtn.textContent = `⬇ ${dlFilename}`;
    dlBtn.onclick = () => downloadBytes(dlFilename, bytes);
    div.appendChild(dlBtn);
    const hexDump = document.createElement('pre');
    hexDump.className = 'ct-hex-dump';
    hexDump.textContent = ctBytesToHexFull(bytes);
    div.appendChild(hexDump);
  }
  return div;
}

function injectCtInspector(prefix, ctInputs, ctIntermed, ctFinal) {
  const card = el(`${prefix}CipherCard`);
  if (!card) return;

  let insp = el(`${prefix}CtInspector`);
  if (insp) insp.remove();
  insp = document.createElement('div');
  insp.id = `${prefix}CtInspector`;
  insp.className = 'ct-inspector';
  card.appendChild(insp);

  // SK scenario note
  const note = document.createElement('div');
  note.className = 'ct-sk-note';
  note.innerHTML =
    `<strong>ℹ️ <span class="en-only">SK scenario</span><span class="ko-only">SK 시나리오</span></strong><br>` +
    `<span class="en-only">` +
      `<b>Demo</b>: Browser holds the secret key — for demonstration only.<br>` +
      `<b>Production</b>: SK stays on the server. User encrypts locally, sends ciphertext to server, server decrypts and returns only the result bit.` +
    `</span>` +
    `<span class="ko-only">` +
      `<b>데모</b>: 시연 목적으로 브라우저에 비밀키(SK)가 있습니다.<br>` +
      `<b>실서비스</b>: SK는 서버에만 존재합니다. 사용자가 로컬에서 암호화하고 암호문을 서버에 전송하면, 서버가 복호화하여 결과 비트만 반환합니다.` +
    `</span>`;
  insp.appendChild(note);

  // Eval key download
  const ekRow = document.createElement('div');
  ekRow.className = 'ct-ek-row';
  const ekBtn = document.createElement('button');
  ekBtn.className = 'ct-dl-btn ct-ek-btn';
  ekBtn.innerHTML = `⬇ <span class="en-only">Download Eval Key (~35 MB)</span><span class="ko-only">평가키 다운로드 (~35 MB)</span>`;
  let ekBusy = false;
  ekBtn.onclick = async () => {
    if (ekBusy || !fhe) return;
    ekBusy = true;
    ekBtn.disabled = true;
    ekBtn.innerHTML = `<span class="en-only">Saving…</span><span class="ko-only">저장 중…</span>`;
    try {
      const ekBytes = await fhe.saveEvalKey();
      if (ekBytes) downloadBytes(`evalkey_${prefix}.bin`, ekBytes);
    } catch (e) {
      log(`EK save error: ${e.message}`);
    } finally {
      ekBusy = false;
      ekBtn.disabled = false;
      ekBtn.innerHTML = `⬇ <span class="en-only">Download Eval Key (~35 MB)</span><span class="ko-only">평가키 다운로드 (~35 MB)</span>`;
    }
  };
  ekRow.appendChild(ekBtn);
  insp.appendChild(ekRow);

  // Helper to build a labelled section
  function addSection(titleEn, titleKo, items, namePrefix) {
    if (!items || items.length === 0) return;
    const sec = document.createElement('div');
    sec.className = 'ct-insp-section';
    const title = document.createElement('div');
    title.className = 'ct-insp-title';
    title.innerHTML = `<span class="en-only">${titleEn}</span><span class="ko-only">${titleKo}</span>`;
    sec.appendChild(title);
    items.forEach((item, i) => {
      const lbl = item.label || `${namePrefix}_${i}`;
      sec.appendChild(buildCtCard(lbl, item.bytes, `${lbl}_${prefix}.bin`));
    });
    insp.appendChild(sec);
  }

  addSection('Input Ciphertexts', '입력 암호문', ctInputs, 'input');
  addSection('Intermediate Ciphertexts', '중간 암호문', ctIntermed, 'intermed');

  if (ctFinal) {
    addSection('Final Ciphertext', '최종 암호문', [ctFinal], 'final');
  }
}

function showCipherCard(prefix, plainLines, pass, ctBytes, ctInputs, ctIntermed, ctFinal) {
  const card = el(`${prefix}CipherCard`);
  if (!card) return;

  el(`${prefix}PlainText`).textContent = plainLines;

  // Full ciphertext hex (scrollable)
  const hexBox = el(`${prefix}HexText`);
  if (ctBytes) {
    hexBox.textContent = ctBytesToHexFull(ctBytes) + `\n\n(${ctBytes.length} bytes total)`;
  } else {
    hexBox.textContent = '(no ciphertext data)';
  }

  // 3열: 서버 내부 복호화 결과 — locked until Decrypt button pressed
  const bit = el(`${prefix}ResultBit`);
  bit.textContent = '🔒';
  bit.className   = 'so-bit locked';

  // 4열: 서버 → 브라우저 응답 — also locked
  const respBit = el(`${prefix}RespBit`);
  respBit.textContent = '🔒';
  respBit.className   = 'sr-result-bit locked';

  // Inject Decrypt button into result box (create once, reuse)
  const resultBox = el(`${prefix}ResultBox`);
  let decBtn = el(`${prefix}DecryptBtn`);
  if (!decBtn) {
    decBtn = document.createElement('button');
    decBtn.id = `${prefix}DecryptBtn`;
    decBtn.className = 'decrypt-btn';
    if (resultBox) resultBox.appendChild(decBtn);
  }
  decBtn.textContent = '🔓 Decrypt';
  decBtn.style.display = 'inline-block';
  decBtn.onclick = () => {
    bit.textContent = pass ? '1' : '0';
    bit.className   = `so-bit ${pass ? 'pass' : 'fail'}`;
    respBit.textContent = pass ? t('1 (pass)', '1 (통과)') : t('0 (reject)', '0 (거부)');
    respBit.className   = `sr-result-bit ${pass ? 'pass' : 'fail'}`;
    decBtn.style.display = 'none';
    // Demo receipt shown only after decrypt
    const proofBytes = new Uint8Array(20);
    crypto.getRandomValues(proofBytes);
    const proofHex = Array.from(proofBytes, b => b.toString(16).padStart(2, '0'));
    const proofEl = el(`${prefix}ProofVal`);
    if (proofEl) proofEl.textContent =
      `demo-receipt: ${proofHex.slice(0,8).join('')}\n              ${proofHex.slice(8,16).join('')}\n              ${proofHex.slice(16).join('')}…`;
    const verifyEl = el(`${prefix}VerifyNote`);
    if (verifyEl) verifyEl.textContent = t('Production: verified with server signature', '실서비스: 서버 서명으로 검증');
    // ciphertext hex remains visible — do NOT clear hexBox
  };

  // Reset receipt fields to locked state
  const proofEl = el(`${prefix}ProofVal`);
  if (proofEl) proofEl.textContent = '🔒 (decrypt to reveal)';
  const verifyEl = el(`${prefix}VerifyNote`);
  if (verifyEl) verifyEl.textContent = '';

  card.style.display = 'block';

  // Inject CT inspector (input / intermediate / final + eval key download)
  injectCtInspector(prefix, ctInputs || [], ctIntermed || [], ctFinal || null);
}

// ── Result display ────────────────────────────────────────────────────────────
function showResult(prefix, pass, computeMs, detail) {
  const section = el(`${prefix}Result`);
  section.className = `result-panel ${pass ? 'pass' : 'fail'}`;
  el(`${prefix}Emoji`).textContent   = pass ? '🎉' : '😔';
  el(`${prefix}Verdict`).textContent = prefix === 'hr'
    ? (pass ? t('Pass', '합격') : t('Fail', '불합격'))
    : (pass ? t('Approved', '통과') : t('Declined', '미통과'));
  el(`${prefix}Detail`).textContent = detail;
  el(`${prefix}Time`).textContent   = `FHE compute: ${computeMs.toFixed(1)} ms`;
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showEDRResult(r) {
  const section = el('edrResult');
  section.className = `result-panel ${r.alert ? 'fail' : 'pass'}`;
  el('edrEmoji').textContent   = r.alert ? '🚨' : '✅';
  el('edrVerdict').textContent = r.alert ? t('Threat detected', '위협 탐지') : t('Clean', '정상');

  const badge = el('edrSeverityBadge');
  if (r.alert) {
    badge.innerHTML = `<span class="severity-badge ${r.severity}">${
      r.severity === 'critical' ? t('Critical','심각') : r.severity === 'high' ? t('High','높음') : t('Medium','보통')
    }</span>`;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }

  const FAMILY_LABEL = {
    'lateral-move': t('Lateral Movement', '횡방향 이동 (Lateral Movement)'),
    'script-chain': t('Script Chain Execution', '스크립트 체인 실행 (Script Chain)'),
    'none': '',
  };
  el('edrDetail').textContent = r.alert
    ? t(`Detection pattern: ${FAMILY_LABEL[r.family] ?? r.family}. Exact detection rules are not disclosed.`,
        `탐지 패턴: ${FAMILY_LABEL[r.family] ?? r.family}. 정확한 탐지 규칙은 공개되지 않았습니다.`)
    : t('No threat detected in the analyzed behavior pattern. Detection rules are not disclosed.',
        '분석된 행위 패턴에서 위협이 감지되지 않았습니다. 탐지 규칙은 공개되지 않았습니다.');
  el('edrTime').textContent = `FHE compute: ${r.computeMs.toFixed(1)} ms`;

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Log toggle ────────────────────────────────────────────────────────────────
let logVisible = true;
el('logToggle').addEventListener('click', () => {
  logVisible = !logVisible;
  logOutput.style.display = logVisible ? 'block' : 'none';
  el('logToggle').textContent = (logVisible ? '▼' : '▶') + ' Runtime Log';
});
el('clearLogBtn').addEventListener('click', () => { logOutput.textContent = ''; });

// ── Manual buttons ────────────────────────────────────────────────────────────
loadButton.addEventListener('click', loadModule);
keygenButton.addEventListener('click', generateKeys);

// ── Auto-load ─────────────────────────────────────────────────────────────────
function autoLoad() {
  log(t('Page loaded — auto-initializing FHE16 module…', '페이지 로드 완료 — FHE16 모듈 자동 초기화 중…'));
  loadModule();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoLoad, { once: true });
} else {
  autoLoad();
}
