import { availableFHE16Builds, loadFHE16Worker } from './dist/fhe16-web.mjs';

// op metadata: inputs = 'c'(unary) | 'cc'(binary enc,enc) | 'ci'/'ck'(enc,plaintext) | 'ccc'(ternary)
const OP_META = {
  add:'cc', sub:'cc', smull:'cc', fmull:'cc', sdiv:'cc', smod:'cc', udiv:'cc', umod:'cc',
  min:'cc', max:'cc', add3:'ccc', ge:'cc', gt:'cc', le:'cc', lt:'cc', eq:'cc', neq:'cc',
  and:'cc', or:'cc', xor:'cc', neg:'c', abs:'c',
  shl:'ck', shr:'ck', ashiftr:'ck', rotatel:'ck', rotater:'ck',
  add_const:'ci', sub_const:'ci', smull_const:'ci', sdiv_const:'ci', smod_const:'ci',
  div_const:'ci', mod_const:'ci', ge_const:'ci', gt_const:'ci', le_const:'ci', lt_const:'ci',
  const_sdiv:'ic', const_smod:'ic', const_udiv:'ic', const_umod:'ic',
  sdiv_pow2:'ck', smod_pow2:'ck', div_pow2:'ck', mod_pow2:'ck',
};

const BOOL_OPS = new Set(['ge','gt','le','lt','eq','neq','ge_const','gt_const','le_const','lt_const']);

function jsExpected(op, a, b, c) {
  const s32 = (v) => v | 0;
  const u32 = (v) => v >>> 0;
  const pow2 = (k) => 2 ** (k & 31);
  switch (op) {
    case 'add': return s32(a + b);
    case 'sub': return s32(a - b);
    case 'smull': return Math.imul(a, b);
    case 'fmull': { const p = BigInt(a | 0) * BigInt(b | 0); return Number(p) | 0; }
    case 'sdiv': return b !== 0 ? s32(Math.trunc(a / b)) : null;
    case 'smod': return b !== 0 ? s32(a - Math.trunc(a / b) * b) : null;
    case 'udiv': return u32(b) !== 0 ? s32(Math.floor(u32(a) / u32(b))) : null;
    case 'umod': return u32(b) !== 0 ? s32(u32(a) % u32(b)) : null;
    case 'min': return s32(Math.min(a, b));
    case 'max': return s32(Math.max(a, b));
    case 'add3': return s32(a + b + c);
    case 'ge': return Number(a >= b);
    case 'gt': return Number(a > b);
    case 'le': return Number(a <= b);
    case 'lt': return Number(a < b);
    case 'eq': return Number(a === b);
    case 'neq': return Number(a !== b);
    case 'and': return s32(a & b);
    case 'or':  return s32(a | b);
    case 'xor': return s32(a ^ b);
    case 'neg': return s32(-a);
    case 'abs': return s32(Math.abs(a));
    case 'shl': return s32(a << b);
    // logical shift는 >>>가 필수 — JS의 >>는 u32(a)를 다시 int32로 강제변환(ToInt32)해서
    // arithmetic shift가 되어버림 (shr(-420,2)의 기대값이 -105로 잘못 나왔던 버그).
    case 'shr': return s32(u32(a) >>> (b & 31));
    case 'ashiftr': return s32(a >> b);
    case 'rotatel': { const k = ((b % 32) + 32) % 32; return k === 0 ? s32(a) : s32((a << k) | (u32(a) >>> (32 - k))); }
    case 'rotater': { const k = ((b % 32) + 32) % 32; return k === 0 ? s32(a) : s32((u32(a) >>> k) | (a << (32 - k))); }
    case 'add_const': return s32(a + b);
    case 'sub_const': return s32(a - b);
    case 'smull_const': return Math.imul(a, b);
    case 'sdiv_const': return b !== 0 ? s32(Math.trunc(a / b)) : null;
    case 'smod_const': return b !== 0 ? s32(a - Math.trunc(a / b) * b) : null;
    case 'div_const':  return u32(b) !== 0 ? s32(Math.floor(u32(a) / u32(b))) : null;
    case 'mod_const':  return u32(b) !== 0 ? s32(u32(a) % u32(b)) : null;
    // imm ÷ enc: a=plaintext dividend, b=encrypted divisor
    case 'const_sdiv': return b !== 0 ? s32(Math.trunc(a / b)) : null;
    case 'const_smod': return b !== 0 ? s32(a - Math.trunc(a / b) * b) : null;
    case 'const_udiv': return u32(b) !== 0 ? s32(Math.floor(u32(a) / u32(b))) : null;
    case 'const_umod': return u32(b) !== 0 ? s32(u32(a) % u32(b)) : null;
    case 'ge_const': return Number(a >= b);
    case 'gt_const': return Number(a > b);
    case 'le_const': return Number(a <= b);
    case 'lt_const': return Number(a < b);
    case 'sdiv_pow2': { const k = b & 31; const d = pow2(k); return k === 0 ? a : s32(Math.trunc(a / d)); }
    case 'smod_pow2': { const k = b & 31; const d = pow2(k); return k === 0 ? 0 : s32(a - Math.trunc(a / d) * d); }
    case 'div_pow2':  return s32(u32(a) >>> (b & 31));
    case 'mod_pow2':  return s32(u32(a) & (pow2(b) - 1));
    default: return null;
  }
}

const els = {
  buildSelect: document.getElementById('buildSelect'),
  threadSelect: document.getElementById('threadSelect'),
  loadButton: document.getElementById('loadButton'),
  keygenButton: document.getElementById('keygenButton'),
  evalKeyDlButton: document.getElementById('evalKeyDlButton'),
  statusText: document.getElementById('statusText'),
  logOutput: document.getElementById('logOutput'),
  clearLogButton: document.getElementById('clearLogButton'),
  gateOp: document.getElementById('gateOp'),
  gateA: document.getElementById('gateA'),
  gateB: document.getElementById('gateB'),
  runGateBtn: document.getElementById('runGateBtn'),
  gateResult: document.getElementById('gateResult'),
  arithOp: document.getElementById('arithOp'),
  arithA: document.getElementById('arithA'),
  arithB: document.getElementById('arithB'),
  arithBField: document.getElementById('arithBField'),
  arithC: document.getElementById('arithC'),
  arithCField: document.getElementById('arithCField'),
  runArithBtn: document.getElementById('runArithBtn'),
  arithResult: document.getElementById('arithResult'),
  ctSection: document.getElementById('ctSection'),
  ctGrid: document.getElementById('ctGrid'),
  fpOp: document.getElementById('fpOp'),
  fpA: document.getElementById('fpA'),
  fpB: document.getElementById('fpB'),
  runFpBtn: document.getElementById('runFpBtn'),
  fpResult: document.getElementById('fpResult'),
  fpCtSection: document.getElementById('fpCtSection'),
  fpCtGrid: document.getElementById('fpCtGrid'),
};

let fhe = null;
let busy = false;

const LOG_MAX_LINES = 500;
let _logLines = [];

function log(msg) {
  const stamp = new Date().toLocaleTimeString();
  _logLines.push(`[${stamp}] ${msg}`);
  if (_logLines.length > LOG_MAX_LINES) _logLines.splice(0, _logLines.length - LOG_MAX_LINES);
  const el = els.logOutput;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  el.textContent = _logLines.join('\n') + '\n';
  if (atBottom) el.scrollTop = el.scrollHeight;
}

function setStatus(text) { els.statusText.textContent = text; }

// Runtime log/status follow the KOR/EN toggle (i18n.js sets .lang-ko).
const isKo = () => document.documentElement.classList.contains('lang-ko');
const L = (ko, en) => (isKo() ? ko : en);

function setBusy(b) {
  busy = b;
  els.loadButton.disabled = b || Boolean(fhe);
  els.buildSelect.disabled = b || Boolean(fhe);
  els.threadSelect.disabled = b || Boolean(fhe);
  els.keygenButton.disabled = b || !fhe || fhe.keysReady;
  els.evalKeyDlButton.disabled = b || !fhe?.keysReady;
  els.runGateBtn.disabled = b || !fhe?.keysReady;
  els.runArithBtn.disabled = b || !fhe?.keysReady;
  els.runFpBtn.disabled = b || !fhe?.keysReady;
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function hexPreview(bytes) {
  // Show all bytes, 16 per line (scrollable via CSS max-height).
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const row = [];
    for (let j = i; j < Math.min(i + 16, bytes.length); j++)
      row.push(bytes[j].toString(16).padStart(2, '0'));
    lines.push(row.join(' '));
  }
  return lines.join('\n');
}

let _lastCTs = {};

function bytesToHexString(bytes) {
  const parts = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) parts[i] = bytes[i].toString(16).padStart(2, '0');
  return parts.join('');
}

function downloadHex(bytes, filename) {
  const hex = bytesToHexString(bytes);
  const blob = new Blob([hex], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// CT_HEADER (CMAKEPARAM.h): 64 × int32. Slots 0-19 named, 20-31 var_table, 32-63 reserved.
const CT_HDR_LABELS = [
  'nbits', 'ct_length', 'nbits_log', 'op_type', 'self_id',
  'param_hash[0]', 'param_hash[1]', 'param_hash[2]', 'param_hash[3]',
  'inputs_hash[0]', 'inputs_hash[1]', 'inputs_hash[2]', 'inputs_hash[3]',
  'num_inputs', 'slot_start', 'slot_end', 'flags', 'dtype', 'step', 'reserved',
];
function metaHeaderText(header) {
  return header.map((v, i) => {
    const lbl = CT_HDR_LABELS[i] || (i >= 20 && i <= 31 ? `var_table[${i - 20}]` : `reserved[${i}]`);
    return `[${String(i).padStart(2)}] ${lbl.padEnd(14)} = ${v}`;
  }).join('\n');
}

function renderCtCard(label, valueStr, info, basename) {
  if (!info) return '';
  const id = `ct_${basename.replace(/\W/g, '_')}`;
  _lastCTs[id] = { bytes: info.bytes, filename: basename + '.hex' };
  const metaBlock = info.header && info.header.length
    ? `<span class="ct-label" style="margin-top:6px">Metadata header (${info.header.length} × int32)</span>
       <span class="ct-hex">${metaHeaderText(info.header)}</span>`
    : '';
  return `<div class="ct-card">
    <span class="ct-label">${label}</span>
    <span class="ct-value">${valueStr}</span>
    <span class="ct-meta">${info.nbits}-bit &nbsp;·&nbsp; ${fmtBytes(info.dataBytes)} data</span>
    ${metaBlock}
    <span class="ct-label" style="margin-top:6px">Ciphertext body (hex)</span>
    <span class="ct-hex">${hexPreview(info.bytes)}</span>
    <button class="ct-dl" data-ctid="${id}">⬇ .hex</button>
  </div>`;
}

function rcard(label, value, extra = '') {
  return `<div class="rcard ${extra}"><span>${label}</span><strong>${value}</strong></div>`;
}

async function loadModule() {
  if (fhe || busy) return;
  setBusy(true);
  setStatus(L('로딩 중…','Loading…'));
  try {
    const build = els.buildSelect.value;
    const selectedThreads = els.threadSelect.value;
    fhe = await loadFHE16Worker({
      build: build === 'auto-fastest' ? 'auto' : build,
      policy: build === 'auto-fastest' ? 'fastest' : 'stable',
      baseUrl: './',
      threadCount: selectedThreads === 'auto' ? 'auto' : Number(selectedThreads),
      includeCiphertextBytes: true,
      onLog: log,
      onStatus: (t) => log(`status: ${t}`),
    });
    setStatus(L('모듈 로드 완료','Module loaded'));
    log(`${L('로드됨','Loaded')} ${fhe.version} / ${fhe.metadata.label}`);
    // For Auto Stable/Fastest, show the build that actually resolved instead of "Auto…".
    if ((build === 'auto' || build === 'auto-fastest') && fhe.metadata?.build) {
      const opt = [...els.buildSelect.options].find((o) => o.value === fhe.metadata.build);
      if (opt) {
        opt.textContent = fhe.metadata.label || opt.textContent;   // exact loaded label
        els.buildSelect.value = fhe.metadata.build;
      }
    }
  } catch (e) {
    fhe = null;
    setStatus(L('로드 실패','Load failed'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
}

async function generateKeys() {
  if (!fhe || fhe.keysReady || busy) return;
  setBusy(true);
  setStatus(L('키 생성 중…','Generating keys…'));
  log(L('FHE16_GenEval 시작','FHE16_GenEval started'));
  await yieldFrame();
  try {
    const ms = await fhe.generateKeys();
    const threadInfo = await fhe.getThreadInfo();
    setStatus(L('키 준비 완료','Keys ready'));
    log(`${L('키 생성 완료','Keys generated in')} ${ms.toFixed(0)} ms`);
    const mode = threadInfo.pthreads ? 'pthreads' : 'single-thread fallback';
    log(`Threads: ${threadInfo.threadCount} worker(s) / ${threadInfo.hardwareConcurrency} logical core(s) (${mode})`);
    log(`Emscripten pthread pool: ${threadInfo.pthreadPoolSize ?? 0} slot(s)`);
    const p = threadInfo.threadPolicy;
    if (p) log(`Thread policy: ${p.mode}, requested=${p.requested}, capacity=${p.capacity}, deviceMemory=${p.deviceMemoryGiB ?? 'unknown'} GiB`);
    if (threadInfo.linearMemoryBytes) log(`Linear memory: ${fmtBytes(threadInfo.linearMemoryBytes)}`);
  } catch (e) {
    setStatus(L('키 생성 실패','Keygen failed'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
}

async function runGate() {
  if (!fhe?.keysReady || busy) return;
  setBusy(true);
  const op = els.gateOp.value;
  const a = els.gateA.checked ? 1 : 0;
  const b = els.gateB.checked ? 1 : 0;
  setStatus(`${L('실행 중','Running')} ${op}…`);
  await yieldFrame();
  try {
    const r = await fhe.runGate(op, a, b);
    const label = op === 'NEG' ? `NOT ${a}` : `${a} ${op} ${b}`;
    log(`${label} = ${r.result} (expected ${r.expected}) — ${r.gateMs.toFixed(1)} ms — ${r.pass ? 'PASS' : 'FAIL'}`);
    els.gateResult.style.display = 'grid';
    els.gateResult.innerHTML =
      rcard('Input A', a) +
      (op !== 'NEG' ? rcard('Input B', b) : '') +
      rcard('Expected', r.expected) +
      rcard('Decrypted', r.result, r.pass ? 'pass-card' : 'fail-card') +
      rcard('Gate Time', `${r.gateMs.toFixed(1)} ms`) +
      rcard('Result', r.pass ? 'PASS' : 'FAIL', r.pass ? 'pass-card' : 'fail-card');
    setStatus(r.pass ? 'PASS' : 'FAIL');
  } catch (e) {
    setStatus(L('오류','Error'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
}

async function runArith() {
  if (!fhe?.keysReady || busy) return;
  const op = els.arithOp.value;
  const meta = OP_META[op];
  const a = Number(els.arithA.value) | 0;
  const b = meta !== 'c' ? (Number(els.arithB.value) | 0) : 0;
  const c = meta === 'ccc' ? (Number(els.arithC.value) | 0) : 0;
  if (op === 'sdiv' || op === 'udiv' || op === 'const_sdiv' || op === 'const_smod' || op === 'const_udiv' || op === 'const_umod') {
    log(`${L('경고','WARNING')}: ${op} ${L('(32-bit FHE 나눗셈)은 수 분이 걸립니다 — 브라우저가 멈춘 것처럼 보일 수 있습니다.','(32-bit FHE division) takes several minutes — browser may appear frozen.')}`);
  }
  setBusy(true);
  setStatus(`${L('실행 중','Running')} ${op}…`);
  await yieldFrame();
  try {
    const r = await fhe.runOp(op, a, b, c);
    const exp = jsExpected(op, a, b, c);
    const pass = exp === null ? null : (r.value === exp);
    const passStr = pass === null ? 'N/A' : (pass ? 'PASS' : 'FAIL');
    const expStr = exp === null ? 'N/A' : String(exp);
    const bLabel = meta === 'ck' ? 'k' : meta === 'ci' ? 'imm' : meta === 'ic' ? 'B (enc)' : 'B';
    const argsLog = meta === 'c' ? `${a}` : meta === 'ccc' ? `${a}, ${b}, ${c}` : `${a}, ${b}`;
    log(`${op}(${argsLog}) = ${r.value} (expected ${expStr}) — ${r.opMs.toFixed(1)} ms — ${passStr}`);
    els.arithResult.style.display = 'grid';
    const aLabel = meta === 'ic' ? 'A (const)' : 'A (enc)';
    els.arithResult.innerHTML =
      rcard(aLabel, a) +
      (meta !== 'c' ? rcard(`${bLabel}${meta === 'cc' || meta === 'ccc' ? ' (enc)' : meta === 'ic' ? '' : ' (const)'}`, b) : '') +
      (meta === 'ccc' ? rcard('C (enc)', c) : '') +
      rcard('Expected', expStr) +
      rcard('Decrypted', r.value, pass === null ? '' : pass ? 'pass-card' : 'fail-card') +
      rcard('Compute Time', `${r.opMs.toFixed(1)} ms`) +
      rcard('Result', passStr, pass === null ? '' : pass ? 'pass-card' : 'fail-card');

    // CT display
    _lastCTs = {};
    const ctCards = [
      renderCtCard('Ciphertext A', String(a), r.ctAInfo, `ct_A_${op}`),
      meta !== 'c' && meta !== 'ci' && meta !== 'ck'
        ? renderCtCard('Ciphertext B', String(b), r.ctBInfo, `ct_B_${op}`) : '',
      meta === 'ccc'
        ? renderCtCard('Ciphertext C', String(c), r.ctCInfo, `ct_C_${op}`) : '',
      renderCtCard('Result CT', String(r.value), r.ctResInfo, `ct_result_${op}`),
    ].join('');
    if (ctCards) {
      els.ctGrid.innerHTML = ctCards;
      els.ctSection.style.display = '';
    }

    setStatus(pass === null ? 'Done' : pass ? 'PASS' : 'FAIL');
  } catch (e) {
    setStatus(L('오류','Error'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
}

// arity/result metadata (mirror of worker FP_OPS): 1|2 args, 'f'=float / 'b'=bool
const FP_META = {
  fadd:[2,'f'], fsub:[2,'f'], fmul:[2,'f'], fdiv:[2,'f'],
  fmin:[2,'f'], fmax:[2,'f'], fcopysign:[2,'f'],
  fabs:[1,'f'], fneg:[1,'f'], ffloor:[1,'f'], fceil:[1,'f'], fround:[1,'f'], ftrunc:[1,'f'],
  flt:[2,'b'], fgt:[2,'b'], fle:[2,'b'], fge:[2,'b'], feq:[2,'b'], fne:[2,'b'],
};
function fpArity(op) { return (FP_META[op] || [2,'f'])[0]; }
function fpRet(op)   { return (FP_META[op] || [2,'f'])[1]; }

function jsExpectedFp(op, a, b, fptype) {
  const toFp = fptype === 'f64' ? (v) => v : Math.fround;
  const fa = toFp(a), fb = toFp(b);
  const copysign = (m, s) => (s < 0 || Object.is(s, -0)) ? -Math.abs(m) : Math.abs(m);
  switch (op) {
    case 'fadd': return toFp(fa + fb);
    case 'fsub': return toFp(fa - fb);
    case 'fmul': return toFp(fa * fb);
    case 'fdiv': return toFp(fa / fb);
    case 'fmin': return toFp(Math.min(fa, fb));
    case 'fmax': return toFp(Math.max(fa, fb));
    case 'fcopysign': return toFp(copysign(fa, fb));
    case 'fabs': return toFp(Math.abs(fa));
    case 'fneg': return toFp(-fa);
    case 'ffloor': return toFp(Math.floor(fa));
    case 'fceil': return toFp(Math.ceil(fa));
    case 'fround': return toFp(Math.sign(fa) * Math.round(Math.abs(fa)));  // round half away from zero
    case 'ftrunc': return toFp(Math.trunc(fa));
    case 'flt': return fa < fb ? 1 : 0;
    case 'fgt': return fa > fb ? 1 : 0;
    case 'fle': return fa <= fb ? 1 : 0;
    case 'fge': return fa >= fb ? 1 : 0;
    case 'feq': return fa === fb ? 1 : 0;
    case 'fne': return fa !== fb ? 1 : 0;
    default: return null;
  }
}

async function runFp() {
  if (!fhe?.keysReady || busy) return;
  const op = els.fpOp.value;
  const fptype = 'f32';
  const arity = fpArity(op), ret = fpRet(op);
  const a = Number(els.fpA.value);
  const b = arity === 2 ? Number(els.fpB.value) : 0;
  setBusy(true);
  setStatus(`${L('실행 중','Running')} ${op} (${fptype})…`);
  await yieldFrame();
  try {
    const r = await fhe.runFpOp(op, a, b, fptype);
    const exp = jsExpectedFp(op, a, b, fptype);
    // bool(compare) → exact 0/1;  float → tolerance (FHE rounding)
    let pass;
    if (ret === 'b') {
      pass = exp !== null && r.value === exp;
    } else {
      const tol = fptype === 'f64' ? 1e-9 : 1e-5;
      pass = exp !== null && Math.abs(r.value - exp) <= tol * (Math.abs(exp) + 1);
    }
    const passStr = pass ? 'PASS' : 'FAIL';
    const argsLog = arity === 2 ? `${a}, ${b}` : `${a}`;
    log(`${op}(${argsLog}) [${fptype}] = ${r.value} (expected ${exp}) — ${r.opMs.toFixed(1)} ms — ${passStr}`);
    els.fpResult.style.display = 'grid';
    els.fpResult.innerHTML =
      rcard('A', String(a)) +
      (arity === 2 ? rcard('B', String(b)) : '') +
      rcard('Expected', exp !== null ? String(exp) : 'N/A') +
      rcard('Decrypted', String(r.value), pass ? 'pass-card' : 'fail-card') +
      rcard('Compute Time', `${r.opMs.toFixed(1)} ms`) +
      rcard('Result', passStr, pass ? 'pass-card' : 'fail-card');

    // CT display
    _lastCTs = {};
    const ctCards = [
      renderCtCard('Ciphertext A', String(a), r.ctAInfo, `fct_A_${op}`),
      arity === 2 ? renderCtCard('Ciphertext B', String(b), r.ctBInfo, `fct_B_${op}`) : '',
      renderCtCard('Result CT', String(r.value), r.ctResInfo, `fct_result_${op}`),
    ].join('');
    if (ctCards) {
      els.fpCtGrid.innerHTML = ctCards;
      els.fpCtSection.style.display = '';
    }
    setStatus(pass ? 'PASS' : 'FAIL');
  } catch (e) {
    setStatus(L('오류','Error'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
}

function yieldFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// Build select init
els.buildSelect.innerHTML = [
  '<option value="auto">Auto Stable</option>',
  '<option value="auto-fastest">Auto Fastest</option>',
  ...availableFHE16Builds().map((b) => `<option value="${b.name}">${b.label}</option>`),
].join('');

function updateArithFields() {
  const meta = OP_META[els.arithOp.value];
  els.arithBField.style.display = meta === 'c' ? 'none' : '';
  els.arithCField.style.display = meta === 'ccc' ? '' : 'none';
  const aLabel = document.querySelector('label[for="arithA"]');
  if (aLabel) aLabel.textContent = meta === 'ic' ? 'A (const)' : 'A (enc)';
  const bLabel = document.getElementById('arithBLabel');
  if (bLabel) {
    if (meta === 'ck') bLabel.textContent = 'k (const)';
    else if (meta === 'ci') bLabel.textContent = 'imm (const)';
    else if (meta === 'ic') bLabel.textContent = 'B (enc)';
    else bLabel.textContent = 'B (enc)';
  }
}
els.arithOp.addEventListener('change', updateArithFields);
updateArithFields();

els.loadButton.addEventListener('click', loadModule);
els.keygenButton.addEventListener('click', generateKeys);
els.runGateBtn.addEventListener('click', runGate);
els.runArithBtn.addEventListener('click', runArith);
els.runFpBtn.addEventListener('click', runFp);
// Hide the B operand for unary float ops (fabs/fneg/floor/ceil/round/trunc).
function updateFpFields() {
  const bField = els.fpB && els.fpB.closest('.field');
  if (bField) bField.style.display = fpArity(els.fpOp.value) === 2 ? '' : 'none';
}
els.fpOp.addEventListener('change', updateFpFields);
updateFpFields();
els.clearLogButton.addEventListener('click', () => { _logLines = []; els.logOutput.textContent = ''; });

// CT download via event delegation (shared handler for both arith and fp grids)
function handleCtDlClick(e) {
  const btn = e.target.closest('.ct-dl');
  if (!btn) return;
  const ctid = btn.dataset.ctid;
  const entry = _lastCTs[ctid];
  if (entry?.bytes) downloadHex(entry.bytes, entry.filename);
}
els.ctGrid.addEventListener('click', handleCtDlClick);
els.fpCtGrid.addEventListener('click', handleCtDlClick);

// Eval key download
els.evalKeyDlButton.addEventListener('click', async () => {
  if (!fhe?.keysReady || busy) return;
  setBusy(true);
  setStatus(L('평가키 직렬화 중…','Serializing eval key…'));
  log(L('평가키 직렬화 시작…','Serializing eval key started…'));
  try {
    const bytes = await fhe.saveEvalKey();
    log(`${L('평가키','Eval key')} ${fmtBytes(bytes.length)} — ${L('다운로드 시작','download started')}`);
    downloadBytes(bytes, 'fhe16_evalkey.bin');
    setStatus(L('키 준비 완료','Keys ready'));
  } catch (e) {
    setStatus(L('오류','Error'));
    log(`ERROR: ${e.message}`);
  } finally {
    setBusy(false);
  }
});

log(L('준비 완료. FHE16 모듈을 로드하고 키를 생성해 시작하세요.','Ready. Load the FHE16 module and generate keys to start.'));
