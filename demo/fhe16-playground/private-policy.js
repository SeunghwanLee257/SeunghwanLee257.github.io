import { availableFHE16Builds, loadFHE16Worker } from './dist/fhe16-web.mjs?v=58';

const $ = (id) => document.getElementById(id);
const buildSelect = $('buildSelect');
const loadButton = $('loadButton');
const keygenButton = $('keygenButton');
const statusText = $('statusText');
const logOutput = $('runtimeLog');
const runFinanceBtn = $('runFinanceBtn');
const runEdrBtn = $('runEdrBtn');
const resultBox = $('resultBox');
const serverLearns = $('serverLearns');
const userLearns = $('userLearns');

let fhe = null;
let busy = false;
let activeDemo = 'finance';

buildSelect.innerHTML = [
  '<option value="auto">Auto Stable</option>',
  '<option value="auto-fastest">Auto Fastest</option>',
  ...availableFHE16Builds().map((b) => `<option value="${b.name}">${b.label}</option>`),
].join('');

function log(message) {
  const t = new Date().toLocaleTimeString();
  logOutput.textContent += `[${t}] ${message}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

function setStatus(text) {
  statusText.textContent = text;
}

function setRunEnabled(enabled) {
  runFinanceBtn.disabled = !enabled;
  runEdrBtn.disabled = !enabled;
}

function setBusy(nextBusy) {
  busy = nextBusy;
  loadButton.disabled = nextBusy || Boolean(fhe);
  buildSelect.disabled = nextBusy || Boolean(fhe);
  keygenButton.disabled = nextBusy || !fhe || fhe.keysReady;
  setRunEnabled(Boolean(fhe?.keysReady) && !nextBusy);
}

function resetSteps() {
  for (let i = 1; i <= 5; i += 1) {
    const step = $(`step-${i}`);
    step.className = 'step';
    step.querySelector('.step-num').textContent = String(i);
  }
}

function activateStep(n) {
  for (let i = 1; i <= 5; i += 1) {
    const step = $(`step-${i}`);
    if (i < n) {
      step.className = 'step done';
      step.querySelector('.step-num').textContent = '✓';
    } else if (i === n) {
      step.className = 'step active';
      step.querySelector('.step-num').textContent = String(i);
    } else {
      step.className = 'step';
      step.querySelector('.step-num').textContent = String(i);
    }
  }
}

function completeSteps() {
  for (let i = 1; i <= 5; i += 1) {
    const step = $(`step-${i}`);
    step.className = 'step done';
    step.querySelector('.step-num').textContent = '✓';
  }
}

function mapWorkerStep(n) {
  if (activeDemo === 'finance') {
    if (n <= 3) return 1;
    if (n <= 6) return 3;
    if (n === 7) return 4;
    return 5;
  }
  if (n <= 2) return 1;
  if (n === 3) return 3;
  if (n <= 7) return 4;
  return 5;
}

async function loadModule() {
  if (busy || fhe) return;
  setBusy(true);
  setStatus('Loading module');
  log('Loading FHE16 WASM runtime');
  try {
    const build = buildSelect.value;
    fhe = await loadFHE16Worker({
      build: build === 'auto-fastest' ? 'auto' : build,
      policy: build === 'auto-fastest' ? 'fastest' : 'stable',
      baseUrl: './',
      includeCiphertextBytes: true,
      onLog: (message) => {
        if (message.startsWith('STEP:')) {
          const step = Number(message.split(':')[1]);
          if (Number.isFinite(step)) activateStep(mapWorkerStep(step));
        }
        log(message);
      },
      onStatus: (message) => log(`status: ${message}`),
    });
    log(`Loaded ${fhe.version} / ${fhe.metadata.label}`);
    setStatus('Generating keys');
    const ms = await fhe.generateKeys();
    log(`Keys generated in ${ms.toFixed(0)} ms`);
    setStatus('Ready');
  } catch (error) {
    fhe = null;
    setStatus('Load failed');
    log(`ERROR: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

function ctBytesToHex(bytes, maxBytes = 64) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const rows = [];
  const len = Math.min(view.length, maxBytes);
  for (let i = 0; i < len; i += 8) {
    rows.push(Array.from(view.slice(i, Math.min(i + 8, len)), b => b.toString(16).padStart(2, '0')).join(' '));
  }
  return rows.join('\n') + `\n… (${view.length} bytes total)`;
}

function showCipherAndDefer(ctBytes, onDecrypt) {
  const hexStr = ctBytes ? ctBytesToHex(ctBytes, 64) : '(no ciphertext bytes)';
  resultBox.className = 'result-box cipher-pending';
  resultBox.innerHTML = `
    <div class="cipher-hex-label">🔐 Encrypted result ciphertext</div>
    <pre class="cipher-hex-dump">${hexStr}</pre>
    <button class="decrypt-reveal-btn">🔓 Decrypt result</button>
  `;
  resultBox.querySelector('.decrypt-reveal-btn').addEventListener('click', onDecrypt, { once: true });
}

function showResult({ pass, title, detail, server, user, computeMs }) {
  resultBox.className = `result-box ${pass ? 'pass' : 'fail'}`;
  resultBox.innerHTML = `<div class="result-title">${title}</div><div class="result-detail">${detail}<br>Runtime: ${computeMs.toFixed(1)} ms</div>`;
  serverLearns.textContent = server;
  userLearns.textContent = user;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    if (busy) return;
    activeDemo = tab.dataset.demo;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.demo-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${activeDemo}`));
    resetSteps();
  });
});

$('financeForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;
  activeDemo = 'finance';
  setBusy(true);
  resetSteps();
  setStatus('Running finance prequalification');
  resultBox.className = 'result-box';
  resultBox.innerHTML = '<div class="result-title">Running</div><div class="result-detail">Evaluating private financial buckets against hidden lender thresholds.</div>';

  const buckets = {
    incomeBucket: Number($('incomeBucket').value),
    debtBucket: Number($('debtBucket').value),
    employmentBucket: Number($('employmentBucket').value),
  };
  log(`Finance private bucket inputs submitted: ${JSON.stringify(buckets)}`);

  try {
    const result = await fhe.runPrivatePrequalCheck(buckets);
    completeSteps();
    showCipherAndDefer(result.ctBytes, () => {
      showResult({
        pass: result.approved,
        title: result.approved ? `Prequalified: limit ${result.limitBucket}` : 'Not prequalified',
        detail: result.approved ? 'The workflow can continue without exposing raw financial fields or plaintext thresholds.' : 'The workflow stops at pre-screen. No exact reason or raw field is exposed in this demo.',
        server: 'prequalified bit, limit bucket, policy version, consent receipt',
        user: 'result bucket only; no lender threshold values',
        computeMs: result.computeMs,
      });
      setStatus(result.approved ? 'Prequalified' : 'Not prequalified');
    });
    setStatus('Encrypted — press Decrypt to reveal');
    log(`Finance job complete (${result.computeMs.toFixed(1)} ms) — encrypted`);
  } catch (error) {
    setStatus('Run failed');
    log(`ERROR: ${error.message}`);
  } finally {
    setBusy(false);
  }
});

$('edrForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;
  activeDemo = 'edr';
  setBusy(true);
  resetSteps();
  setStatus('Running EDR rule evaluation');
  resultBox.className = 'result-box';
  resultBox.innerHTML = '<div class="result-title">Running</div><div class="result-detail">Evaluating private endpoint signals against hidden detection rules.</div>';

  const form = new FormData(event.currentTarget);
  const features = {
    unsignedBinary: form.has('unsignedBinary'),
    rareParent: form.has('rareParent'),
    suspiciousOutbound: form.has('suspiciousOutbound'),
    privilegeEscalation: form.has('privilegeEscalation'),
    scriptSpawn: form.has('scriptSpawn'),
    sensitivePath: form.has('sensitivePath'),
    eventCountBucket: Number($('eventCountBucket').value),
  };
  log(`EDR private feature bits submitted: ${JSON.stringify(features)}`);

  try {
    const result = await fhe.runEDRCheck(features);
    completeSteps();
    showCipherAndDefer(result.ctBytes, () => {
      showResult({
        pass: result.alert,
        title: result.alert ? `Alert: ${result.severity}` : 'No alert',
        detail: result.alert ? `Only severity and coarse rule family are released: ${result.family}.` : 'No raw process path, hostname, or exact rule threshold is released.',
        server: result.alert ? 'alert bit, severity bucket, coarse rule family' : 'no-alert bit and policy version',
        user: 'no plaintext detection threshold or full rule logic',
        computeMs: result.computeMs,
      });
      setStatus(result.alert ? 'Alert generated' : 'No alert');
    });
    setStatus('Encrypted — press Decrypt to reveal');
    log(`EDR job complete (${result.computeMs.toFixed(1)} ms) — encrypted`);
  } catch (error) {
    setStatus('Run failed');
    log(`ERROR: ${error.message}`);
  } finally {
    setBusy(false);
  }
});

loadButton.addEventListener('click', loadModule);
keygenButton.addEventListener('click', async () => {
  if (!fhe || fhe.keysReady || busy) return;
  setBusy(true);
  try {
    const ms = await fhe.generateKeys();
    log(`Keys generated in ${ms.toFixed(0)} ms`);
    setStatus('Ready');
  } catch (error) {
    log(`ERROR: ${error.message}`);
  } finally {
    setBusy(false);
  }
});
$('clearLogButton').addEventListener('click', () => { logOutput.textContent = ''; });

resetSteps();
setRunEnabled(false);
log('Ready. Load the module to start the private policy demo.');
loadModule();
