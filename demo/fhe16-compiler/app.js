// 데모 페이지 — 컴파일러와 백엔드를 잇는 얇은 껍데기.
// 2026-09-14
import { compile, createPlainBackend, createFHE16Backend, inspectFHE16, instrument } from './src/index.js';

const $ = id => document.getElementById(id);

/** 현재 언어. i18n.js 가 html 요소에 lang-ko 클래스를 붙인다. */
function isKo() {
  return document.documentElement.classList.contains('lang-ko');
}
/** 영문·한글 한 쌍에서 현재 언어를 고른다. */
function t(en, ko) {
  return isKo() ? ko : en;
}


const SAMPLES = {
  risk: {
    label: 'Credit risk decision', labelKo: '여신 위험 판정',
    code: `// Runs on ciphertext. Only the verdict comes out.
function riskScore(secret amount, secret history, public threshold) {
  let score = amount / 100 + history * 3;
  if (score > threshold) {
    score = score * 2;
  }
  return score > 500 ? 1 : 0;
}`,
    codeKo: `// 암호문 위에서 돈다. 나오는 것은 판정뿐.
function riskScore(secret amount, secret history, public threshold) {
  let score = amount / 100 + history * 3;
  if (score > threshold) {
    score = score * 2;
  }
  return score > 500 ? 1 : 0;
}`,
    args: '12000, 40, 100',
  },
  match: {
    label: 'Cross-institution check', labelKo: '두 기관 대조',
    code: `// Are these the same event? Neither side sees the other's record.
function crossCheck(secret claimA, secret claimB, public window) {
  const same = claimA == claimB ? 1 : 0;
  const gap = abs(claimA - claimB);
  const near = gap < window ? 1 : 0;
  return same + near;
}`,
    codeKo: `// 같은 사건인지 비교한다. 양쪽 원문은 서로 모른다.
function crossCheck(secret claimA, secret claimB, public window) {
  const same = claimA == claimB ? 1 : 0;
  const gap = abs(claimA - claimB);
  const near = gap < window ? 1 : 0;
  return same + near;
}`,
    args: '8821, 8830, 30',
  },
  loop: {
    label: 'Fixed-count loop', labelKo: '고정 횟수 누적',
    code: `// The iteration count is public. Everything inside stays encrypted.
function weighted(secret base, public rounds) {
  let total = 0;
  for (let i = 1; i < 6; i++) {
    total += base * i;
  }
  return total;
}`,
    codeKo: `// 반복 횟수는 공개 값. 안쪽 값은 전부 암호문.
function weighted(secret base, public rounds) {
  let total = 0;
  for (let i = 1; i < 6; i++) {
    total += base * i;
  }
  return total;
}`,
    args: '7, 5',
  },
  branch: {
    label: 'Nested branches', labelKo: '중첩 분기',
    code: `// Both sides are computed, then merged into one value.
function tier(secret score, secret bonus) {
  let grade = 0;
  if (score > 80) {
    if (bonus > 10) { grade = 1; } else { grade = 2; }
  } else {
    grade = 3;
  }
  return grade;
}`,
    codeKo: `// 양쪽을 다 계산한 뒤 하나로 합친다.
function tier(secret score, secret bonus) {
  let grade = 0;
  if (score > 80) {
    if (bonus > 10) { grade = 1; } else { grade = 2; }
  } else {
    grade = 3;
  }
  return grade;
}`,
    args: '85, 4',
  },
};


let fhe16Module = null;
let fhe16Backend = null;

function log(msg, cls) {
  const el = $('console');
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}
function clearLog() { $('console').textContent = ''; }

function parseArgs(text) {
  return text.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    if (/^-?\d+$/.test(s)) return BigInt(s);
    const n = Number(s);
    if (Number.isNaN(n)) throw new Error(t('Cannot read argument ', '인자 ') + JSON.stringify(s) + t('', ' 를 읽을 수 없다'));
    return n;
  });
}

function renderOps(counts, millis) {
  const rows = Object.entries(counts || {})
    .filter(([k]) => !['encrypt', 'decrypt', 'constant', 'free', 'freeAll', 'liveCount', 'describe'].includes(k))
    .sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '<div class="muted">' + t('No circuit operations — everything folded to constants', '회로 연산 없음 — 전부 상수로 접혔다') + '</div>';
  const total = rows.reduce((s, [, v]) => s + v, 0);
  const body = rows.map(([k, v]) => {
    const ms = millis && millis[k] ? ` <span class="muted">${millis[k].toFixed(1)}ms</span>` : '';
    const pct = Math.round(v / total * 100);
    return `<tr><td><code>${k}</code></td><td class="num">${v}</td><td><div class="bar" style="width:${Math.max(pct, 2)}%"></div></td><td>${ms}</td></tr>`;
  }).join('');
  return `<table class="ops"><tbody>${body}</tbody></table><div class="muted">${t('total ', '합계 ')}${total}${t('', '회')}</div>`;
}

async function runPlain() {
  clearLog();
  const src = $('code').value;
  try {
    const args = parseArgs($('args').value);
    const prog = compile(src);
    log(t('Function ', '함수 ') + prog.name + ' · ' + prog.params.map(p => `${p.visibility} ${p.name}`).join(', '));
    const sink = {};
    const t0 = performance.now();
    const out = prog.run(instrument(createPlainBackend(), sink), args);
    const dt = performance.now() - t0;
    log(t('Result ', '결과 ') + out.value + '  (' + dt.toFixed(2) + 'ms)', 'ok');
    $('ops').innerHTML = renderOps(sink.counts, sink.millis);
    $('result').textContent = String(out.value);
    $('result').className = 'result ok';
  } catch (e) {
    log(e.message, 'err');
    $('result').textContent = t('Error', '오류');
    $('result').className = 'result err';
  }
}

let keysReady = false;

function setEngineStatus(text, cls) {
  const el = $('engine-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'engine-status' + (cls ? ' ' + cls : '');
}

/** 엔진을 내려받고 평가키를 만든다. 버튼으로만 부른다. */
async function prepareEngine() {
  const btn = $('gen-keys');
  if (keysReady) { log(t('Keys are already prepared', '평가키가 이미 준비돼 있다'), 'muted'); return fhe16Backend; }
  btn.disabled = true;
  try {
    setEngineStatus(t('Downloading engine…', '엔진 내려받는 중…'), 'busy');
    log(t('Loading FHE16 WASM — about 40 seconds', 'FHE16 WASM 불러오는 중 — 40초쯤 걸린다'));
    const t0 = performance.now();
    const mod = await import('../fhe16-playground/dist/fhe16-web.mjs');
    const loaded = await mod.loadFHE16({ baseUrl: '../fhe16-playground/' });
    fhe16Module = loaded.module || loaded;
    log(t('Engine loaded in ', '엔진 로드 ') + ((performance.now() - t0) / 1000).toFixed(1) + t(' s', '초'), 'ok');

    const report = inspectFHE16(fhe16Module);
    log(t('Wired operations ', '연결된 연산 ') + report.present.length + t(' · missing ', '종 · 빠진 것 ') + report.missing.length + t('', '종'));
    if (report.missing.length) log(t('Handled by fallback: ', '대체 경로로 처리: ') + report.missing.slice(0, 6).join(', '), 'muted');

    fhe16Backend = createFHE16Backend(fhe16Module);
    setEngineStatus(t('Generating keys…', '평가키 생성 중…'), 'busy');
    log(t('Generating evaluation keys…', '평가키 생성 중…'));
    const t1 = performance.now();
    fhe16Backend.prepare();
    log(t('Keys ready in ', '평가키 ') + ((performance.now() - t1) / 1000).toFixed(1) + t(' s', '초'), 'ok');

    keysReady = true;
    setEngineStatus(t('Ready · ', '준비 완료 · ') + fhe16Backend.describe(), 'ready');
    $('run-enc').disabled = false;
    btn.textContent = t('Regenerate keys', '평가키 재생성');
    btn.disabled = false;
    return fhe16Backend;
  } catch (e) {
    setEngineStatus(t('Failed — ', '실패 — ') + e.message, 'err');
    log(e.message, 'err');
    btn.disabled = false;
    throw e;
  }
}

async function runEncrypted() {
  clearLog();
  const src = $('code').value;
  try {
    if (!keysReady) {
      log(t('Generate the keys first', '먼저 평가키를 생성한다'), 'err');
      setEngineStatus(t('Keys required', '평가키가 필요하다'), 'err');
      return;
    }
    const args = parseArgs($('args').value);
    const backend = fhe16Backend;
    const prog = compile(src);
    const sink = {};
    log(t('Running on ciphertext…', '암호문 위에서 실행 중…'));
    const t0 = performance.now();
    const out = prog.run(instrument(backend, sink), args);
    const dt = performance.now() - t0;
    log(t('Result ', '결과 ') + out.value + '  (' + (dt / 1000).toFixed(2) + t('s', '초') + ')', 'ok');
    $('ops').innerHTML = renderOps(sink.counts, sink.millis);
    $('result').textContent = String(out.value);
    $('result').className = 'result ok';

    const plain = compile(src).run(createPlainBackend(), args);
    const match = String(plain.value) === String(out.value);
    log(match ? t('Matches plaintext run (', '평문 실행과 일치 (') + plain.value + ')' : t('Mismatch — plaintext ', '어긋남 — 평문 ') + plain.value, match ? 'ok' : 'err');
    if (backend.freeAll) log(t('Freed ', '암호문 ') + backend.freeAll() + t(' ciphertexts', '개 해제'), 'muted');
  } catch (e) {
    log(e.message, 'err');
    $('result').textContent = t('Error', '오류');
    $('result').className = 'result err';
  }
}

function showCircuit() {
  clearLog();
  try {
    const prog = compile($('code').value);
    const args = parseArgs($('args').value);
    const trace = [];
    const base = createPlainBackend();
    let seq = 0;
    const names = new Map();
    const label = h => {
      if (h === null || h === undefined) return '·';
      if (!names.has(h)) names.set(h, `t${seq++}`);
      return names.get(h);
    };
    const spy = new Proxy(base, {
      get(t, k) {
        const v = t[k];
        if (typeof v !== 'function' || typeof k !== 'string') return v;
        if (['describe', 'free', 'liveCount'].includes(k)) return v;
        return (...a) => {
          const out = v.apply(t, a);
          if (k === 'encrypt') trace.push(`${label(out)} = encrypt(${a[0]})`);
          else if (k === 'constant') trace.push(`${label(out)} = const(${a[0]})`);
          else if (k === 'decrypt') trace.push(`reveal ${label(a[0])}`);
          else trace.push(`${label(out)} = ${k}(${a.filter(x => x && typeof x === 'object' && 'value' in x).map(label).join(', ')})`);
          return out;
        };
      },
    });
    prog.run(spy, args);
    $('ops').innerHTML = `<pre class="trace">${trace.join('\n')}</pre>`;
    log(t('Circuit steps ', '회로 연산 ') + trace.length + t('', '단계'), 'ok');
  } catch (e) {
    log(e.message, 'err');
  }
}

function init() {
  const sel = $('sample');
  for (const [key, spec] of Object.entries(SAMPLES)) {
    const o = document.createElement('option');
    o.value = key;
    o.setAttribute('data-en', spec.label);
    o.setAttribute('data-ko', spec.labelKo);
    o.textContent = isKo() ? spec.labelKo : spec.label;
    sel.appendChild(o);
  }
  const load = key => {
    const spec = SAMPLES[key];
    $('code').value = isKo() ? spec.codeKo : spec.code;
    $('args').value = spec.args;
    $('result').textContent = '—';
    $('result').className = 'result';
    $('ops').innerHTML = '';
    clearLog();
  };
  sel.addEventListener('change', () => load(sel.value));
  $('run-plain').addEventListener('click', runPlain);
  $('run-enc').addEventListener('click', runEncrypted);
  $('show-circuit').addEventListener('click', showCircuit);
  $('gen-keys').addEventListener('click', () => prepareEngine().catch(() => {}));
  $('run-enc').disabled = true;
  load('risk');
  // 언어 토글을 누르면 예제 코드 주석도 바뀐다
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(() => load(sel.value), 0));
  });
  setEngineStatus(t('No keys', '평가키 없음'), '');
  log(t('Edit the function and check it in plaintext. Generate keys before running on ciphertext.', '함수를 고쳐 쓴 뒤 평문으로 확인한다. 암호문 실행은 평가키를 만든 뒤에 쓴다.'));
}

document.addEventListener('DOMContentLoaded', init);
