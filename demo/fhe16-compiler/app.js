// 데모 페이지 — 컴파일러와 백엔드를 잇는 얇은 껍데기.
// 2026-09-14
import { compile, createPlainBackend, createFHE16Backend, inspectFHE16, instrument } from './src/index.js';

const $ = id => document.getElementById(id);

const SAMPLES = {
  risk: {
    label: '여신 위험 판정',
    code: `// 암호문 위에서 도는 판정. 드러나는 것은 결과 한 값.
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
    label: '두 기관 대조',
    code: `// 같은 사건인지 비교한다. 양쪽 원문은 서로 모른다.
function crossCheck(secret claimA, secret claimB, public window) {
  const same = claimA == claimB ? 1 : 0;
  const gap = abs(claimA - claimB);
  const near = gap < window ? 1 : 0;
  return same + near;
}`,
    args: '8821, 8830, 30',
  },
  loop: {
    label: '고정 횟수 누적',
    code: `// 반복 횟수는 공개 값. 안쪽 값은 전부 암호문.
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
    label: '중첩 분기',
    code: `// if 는 양쪽을 다 계산하고 select 로 합친다.
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
    if (Number.isNaN(n)) throw new Error(`인자 ${JSON.stringify(s)} 를 읽을 수 없다`);
    return n;
  });
}

function renderOps(counts, millis) {
  const rows = Object.entries(counts || {})
    .filter(([k]) => !['encrypt', 'decrypt', 'constant', 'free', 'freeAll', 'liveCount', 'describe'].includes(k))
    .sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '<div class="muted">회로 연산 없음 — 전부 상수로 접혔다</div>';
  const total = rows.reduce((s, [, v]) => s + v, 0);
  const body = rows.map(([k, v]) => {
    const ms = millis && millis[k] ? ` <span class="muted">${millis[k].toFixed(1)}ms</span>` : '';
    const pct = Math.round(v / total * 100);
    return `<tr><td><code>${k}</code></td><td class="num">${v}</td><td><div class="bar" style="width:${Math.max(pct, 2)}%"></div></td><td>${ms}</td></tr>`;
  }).join('');
  return `<table class="ops"><tbody>${body}</tbody></table><div class="muted">합계 ${total}회</div>`;
}

async function runPlain() {
  clearLog();
  const src = $('code').value;
  try {
    const args = parseArgs($('args').value);
    const prog = compile(src);
    log(`함수 ${prog.name} · 파라미터 ${prog.params.map(p => `${p.visibility} ${p.name}`).join(', ')}`);
    const sink = {};
    const t0 = performance.now();
    const out = prog.run(instrument(createPlainBackend(), sink), args);
    const dt = performance.now() - t0;
    log(`결과 ${out.value}  (${dt.toFixed(2)}ms)`, 'ok');
    $('ops').innerHTML = renderOps(sink.counts, sink.millis);
    $('result').textContent = String(out.value);
    $('result').className = 'result ok';
  } catch (e) {
    log(e.message, 'err');
    $('result').textContent = '오류';
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
  if (keysReady) { log('평가키가 이미 준비돼 있다', 'muted'); return fhe16Backend; }
  btn.disabled = true;
  try {
    setEngineStatus('엔진 내려받는 중…', 'busy');
    log('FHE16 WASM 불러오는 중 — 40초쯤 걸린다');
    const t0 = performance.now();
    const mod = await import('../fhe16-playground/dist/fhe16-web.mjs');
    const loaded = await mod.loadFHE16({ baseUrl: '../fhe16-playground/' });
    fhe16Module = loaded.module || loaded;
    log(`엔진 로드 ${((performance.now() - t0) / 1000).toFixed(1)}초`, 'ok');

    const report = inspectFHE16(fhe16Module);
    log(`연결된 연산 ${report.present.length}종 · 빠진 것 ${report.missing.length}종`);
    if (report.missing.length) log(`대체 경로로 처리: ${report.missing.slice(0, 6).join(', ')}`, 'muted');

    fhe16Backend = createFHE16Backend(fhe16Module);
    setEngineStatus('평가키 생성 중…', 'busy');
    log('평가키 생성 중…');
    const t1 = performance.now();
    fhe16Backend.prepare();
    log(`평가키 ${((performance.now() - t1) / 1000).toFixed(1)}초`, 'ok');

    keysReady = true;
    setEngineStatus('준비 완료 · ' + fhe16Backend.describe(), 'ready');
    $('run-enc').disabled = false;
    btn.textContent = '평가키 재생성';
    btn.disabled = false;
    return fhe16Backend;
  } catch (e) {
    setEngineStatus('실패 — ' + e.message, 'err');
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
      log('먼저 평가키를 생성한다', 'err');
      setEngineStatus('평가키가 필요하다', 'err');
      return;
    }
    const args = parseArgs($('args').value);
    const backend = fhe16Backend;
    const prog = compile(src);
    const sink = {};
    log('암호문 위에서 실행 중…');
    const t0 = performance.now();
    const out = prog.run(instrument(backend, sink), args);
    const dt = performance.now() - t0;
    log(`결과 ${out.value}  (${(dt / 1000).toFixed(2)}초)`, 'ok');
    $('ops').innerHTML = renderOps(sink.counts, sink.millis);
    $('result').textContent = String(out.value);
    $('result').className = 'result ok';

    const plain = compile(src).run(createPlainBackend(), args);
    const match = String(plain.value) === String(out.value);
    log(match ? `평문 실행과 일치 (${plain.value})` : `어긋남 — 평문 ${plain.value}`, match ? 'ok' : 'err');
    if (backend.freeAll) log(`암호문 ${backend.freeAll()}개 해제`, 'muted');
  } catch (e) {
    log(e.message, 'err');
    $('result').textContent = '오류';
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
    log(`회로 연산 ${trace.length}단계`, 'ok');
  } catch (e) {
    log(e.message, 'err');
  }
}

function init() {
  const sel = $('sample');
  for (const [key, s] of Object.entries(SAMPLES)) {
    const o = document.createElement('option');
    o.value = key; o.textContent = s.label;
    sel.appendChild(o);
  }
  const load = key => {
    $('code').value = SAMPLES[key].code;
    $('args').value = SAMPLES[key].args;
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
  setEngineStatus('평가키 없음', '');
  log('함수를 고쳐 쓴 뒤 평문으로 확인한다. 암호문 실행은 평가키를 만든 뒤에 쓴다.');
}

document.addEventListener('DOMContentLoaded', init);
