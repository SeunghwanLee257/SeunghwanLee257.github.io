import { availableFHE16Builds, loadFHE16Worker } from './dist/fhe16-web.mjs?v=58';

const $ = (id) => document.getElementById(id);
const buildSelect = $('buildSelect');
const poolSelect = $('poolSelect');
const loadButton = $('loadButton');
const keygenButton = $('keygenButton');
const statusText = $('statusText');
const logOutput = $('runtimeLog');
const runFinanceBtn = $('runFinanceBtn');
const runEdrBtn = $('runEdrBtn');
const resultBox = $('resultBox');
const poolLearns = $('poolLearns');
const serverKeeps = $('serverKeeps');
const zkStatus = $('zkStatus');

let fhe = null;
let busy = false;
let activeScenario = 'finance';

const INCOME_VALUES = [0, 50, 150, 250, 350, 450, 550];
const DEBT_VALUES = [0, 20, 60, 90, 125, 175];
const EMP_VALUES = [0, 1, 2, 4, 6];

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

function setStatus(text) { statusText.textContent = text; }

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

function setStep(n) {
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

function hex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
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

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return hex(new Uint8Array(digest));
}

function shortHash(value) {
  return `${value.slice(0, 12)}…${value.slice(-10)}`;
}

async function buildPacket({ scenario, payload, circuit }) {
  const pool = poolSelect.value;
  const policyVersion = `${scenario}-policy-2026-06-09.v1`;
  const packet = {
    scenario,
    pool,
    policyVersion,
    ciphertextBundle: {
      kind: 'encrypted_user_predicate_bundle',
      fields: Object.keys(payload),
      payloadCommit: await sha256(JSON.stringify(payload)),
    },
    encryptedPolicyBlob: {
      kind: 'encrypted_policy_blob',
      policyCommit: await sha256(`${policyVersion}:${circuit}:${pool}`),
    },
    circuitManifest: {
      kind: 'boolean_predicate_circuit',
      gates: circuit,
      zkProof: 'deferred_phase_2',
    },
  };
  const packetHash = await sha256(JSON.stringify(packet));
  const circuitHash = await sha256(JSON.stringify(packet.circuitManifest));
  const policyHash = packet.encryptedPolicyBlob.policyCommit;
  $('cipherHash').textContent = `job:${shortHash(packetHash)}\nfields:${packet.ciphertextBundle.fields.join(', ')}`;
  $('circuitHash').textContent = `${shortHash(circuitHash)}\n${circuit}`;
  $('policyCommit').textContent = `${shortHash(policyHash)}\n${policyVersion}`;
  $('computeReceipt').textContent = 'submitted to pool...';
  $('auditAnchor').textContent = 'pending receipt hash';
  zkStatus.textContent = 'ZK phase 2';
  zkStatus.className = 'status-pill warn';
  return { packet, packetHash, circuitHash, policyHash };
}

async function createReceipt(packetHash, resultSummary, computeMs) {
  const receipt = {
    computePool: poolSelect.value,
    packetHash,
    resultSummary,
    computeMs: Number(computeMs.toFixed(1)),
    proof: 'zk_deferred_server_signature_only',
    timestamp: new Date().toISOString(),
  };
  const receiptHash = await sha256(JSON.stringify(receipt));
  $('computeReceipt').textContent = `${shortHash(receiptHash)}\ncompute_ms:${receipt.computeMs}\nproof:${receipt.proof}`;
  $('auditAnchor').textContent = `audit:${shortHash(await sha256(`audit:${receiptHash}`))}\ncommitment only; no raw data`;
  return receipt;
}

async function loadModule() {
  if (busy || fhe) return;
  setBusy(true);
  setStatus('Loading module');
  log('Loading FHE16 WASM runtime for outsourced compute demo');
  try {
    const build = buildSelect.value;
    fhe = await loadFHE16Worker({
      build: build === 'auto-fastest' ? 'auto' : build,
      policy: build === 'auto-fastest' ? 'fastest' : 'stable',
      baseUrl: './',
      includeCiphertextBytes: true,
      onLog: (message) => log(message),
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

function showResult({ pass, title, detail, computeMs }) {
  resultBox.className = `result-box ${pass ? 'pass' : 'fail'}`;
  resultBox.innerHTML = `<div class="result-title">${title}</div><div class="result-detail">${detail}<br>Outsourced compute runtime: ${computeMs.toFixed(1)} ms</div>`;
  poolLearns.textContent = 'FHE outsourcing baseline: ciphertexts, template circuit manifest, policy/version hashes; no SK or plaintext policy';
  serverKeeps.textContent = 'SK, plaintext policy/rule pack, decrypt/sign endpoint, audit budget; MPC/PFE only if private circuit is required';
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    if (busy) return;
    activeScenario = tab.dataset.scenario;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.scenario-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${activeScenario}`));
    resetSteps();
  });
});

$('financeForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!fhe?.keysReady || busy) return;
  activeScenario = 'finance';
  setBusy(true);
  resetSteps();
  setStatus('Packaging finance job');
  resultBox.className = 'result-box';
  resultBox.innerHTML = '<div class="result-title">Packaging</div><div class="result-detail">Creating ciphertext bundle and circuit manifest.</div>';

  const incomeBucket = Number($('incomeBucket').value);
  const debtBucket = Number($('debtBucket').value);
  const employmentBucket = Number($('employmentBucket').value);
  const income = INCOME_VALUES[incomeBucket];
  const debt = DEBT_VALUES[debtBucket];
  const years = EMP_VALUES[employmentBucket];
  const payload = { incomeBucket, debtBucket, employmentBucket, template: $('policyTemplate').value };
  try {
    setStep(1);
    const packet = await buildPacket({
      scenario: 'finance',
      payload,
      circuit: 'approved=(income_ok AND debt_ok AND employment_ok); tier=(income_high AND debt_low)',
    });
    log(`Finance job packet created: ${shortHash(packet.packetHash)}`);
    setStep(2);
    setStatus('Outsourced compute running');
    log(`Submitted encrypted finance job to ${poolSelect.value}`);
    setStep(3);
    const result = await fhe.runCreditCheck(income, debt, years);
    setStep(4);
    const title = result.approved ? `Prequalified: limit ${result.limitBucket}` : 'Not prequalified';
    const detail = result.approved ? 'Compute pool returned enc_result. Server decrypt endpoint released only approval and limit bucket.' : 'Compute pool returned enc_result. Server released only rejection bit; no threshold detail.';
    await createReceipt(packet.packetHash, { approved: result.approved, limitBucket: result.limitBucket }, result.computeMs);
    completeSteps();
    showCipherAndDefer(result.ctBytes, () => {
      showResult({ pass: result.approved, title, detail, computeMs: result.computeMs });
    });
    setStatus('Encrypted — press Decrypt to reveal');
    log(`Finance outsourced job complete: ${title} (${result.computeMs.toFixed(1)} ms)`);
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
  activeScenario = 'edr';
  setBusy(true);
  resetSteps();
  setStatus('Packaging EDR job');
  resultBox.className = 'result-box';
  resultBox.innerHTML = '<div class="result-title">Packaging</div><div class="result-detail">Creating endpoint ciphertext bundle and rule circuit manifest.</div>';

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
  try {
    setStep(1);
    const packet = await buildPacket({
      scenario: 'edr',
      payload: features,
      circuit: 'alert=(unsigned AND rare_parent AND outbound) OR (script AND sensitive AND count_high AND privilege)',
    });
    log(`EDR job packet created: ${shortHash(packet.packetHash)}`);
    setStep(2);
    setStatus('Outsourced compute running');
    log(`Submitted encrypted EDR job to ${poolSelect.value}`);
    setStep(3);
    const result = await fhe.runEDRCheck(features);
    setStep(4);
    const title = result.alert ? `Alert: ${result.severity}` : 'No alert';
    const detail = result.alert ? `Server released alert and coarse family only: ${result.family}.` : 'Server released no-alert bit only; rule thresholds remain server-only.';
    await createReceipt(packet.packetHash, { alert: result.alert, severity: result.severity, family: result.family }, result.computeMs);
    completeSteps();
    showCipherAndDefer(result.ctBytes, () => {
      showResult({ pass: !result.alert, title, detail, computeMs: result.computeMs });
    });
    setStatus('Encrypted — press Decrypt to reveal');
    log(`EDR outsourced job complete: ${title} (${result.computeMs.toFixed(1)} ms)`);
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
log('Ready. Load the module to start outsourced encrypted compute demo.');
loadModule();
