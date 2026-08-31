/* global importScripts */
'use strict';

// Modification counter — incremented each time this file is changed.
// Check the startup log to confirm a new version is loaded in the browser.
const FHE16_JS_MOD_CNT = 57;

// avx8 (pure JS) is appended as final fallback. Auto mode keeps browser-specific
// ordering so Chrome/Edge, Safari, and Firefox can each use the best known path.
// avx7/avx6/avx9 include pthreads; require SharedArrayBuffer (COOP/COEP headers).
const DEFAULT_STABLE_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const DEFAULT_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const SAFARI_STABLE_BUILD_ORDER = ['avx6', 'avx9', 'avx7', 'avx8'];
const SAFARI_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
// Keep a real pthread build ahead of the single-thread wasm2js fallback on all
// engines. Users can still request avx8 explicitly on legacy/non-isolated pages.
const FIREFOX_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const SINGLE_THREAD_WASM_BUILD_ORDER = ['avx6st', 'avx9st', 'avx8'];

const FHE16_MAX_WASM_THREADS = 16;
const FHE16_DEFAULT_WASM_THREADS = 8;

function resolveThreadPolicy(requested = 'auto', pthreads = true) {
  const rawHardware = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) : 1;
  const hardwareConcurrency = Number.isFinite(rawHardware) && rawHardware > 0
    ? Math.floor(rawHardware) : 1;
  const rawMemory = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory) : NaN;
  const deviceMemoryGiB = Number.isFinite(rawMemory) && rawMemory > 0 ? rawMemory : null;
  if (!pthreads) {
    return {
      mode: 'single-thread-fallback', hardwareConcurrency, deviceMemoryGiB,
      requested: 1, effective: 1, capacity: 1,
    };
  }
  const capacity = Math.max(1, Math.min(
    FHE16_MAX_WASM_THREADS,
    hardwareConcurrency,
  ));
  const engine = browserEngine();
  const highEndChromium = (engine === 'chromium' || engine === 'edge')
    && deviceMemoryGiB !== null && deviceMemoryGiB >= 16
    && hardwareConcurrency >= 24;
  // Firefox does not expose navigator.deviceMemory. Installed Firefox 154
  // on a 96-core host improved packed batch16 and ADD8 at 16 FHE workers, so
  // admit the wider pool from the core hint alone. The explicit 2/4 GiB
  // ceilings below still win when a Firefox-family engine exposes one.
  const highEndFirefox = engine === 'firefox' && hardwareConcurrency >= 32;
  const memoryCeiling = deviceMemoryGiB !== null && deviceMemoryGiB <= 2
    ? 2 : deviceMemoryGiB !== null && deviceMemoryGiB <= 4
      ? 4 : highEndChromium || highEndFirefox
        ? FHE16_MAX_WASM_THREADS : FHE16_DEFAULT_WASM_THREADS;
  const automatic = capacity; // use all logical cores (build-capped); no -1, no memory reduction
  if (requested === undefined || requested === null || requested === 'auto') {
    return {
      mode: 'auto', hardwareConcurrency, deviceMemoryGiB,
      requested: 'auto', effective: automatic, capacity,
    };
  }
  const numeric = Number(requested);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new TypeError('threadCount must be "auto" or a positive integer');
  }
  return {
    mode: numeric > capacity ? 'explicit-clamped' : 'explicit',
    hardwareConcurrency, deviceMemoryGiB,
    requested: numeric, effective: Math.min(numeric, capacity), capacity,
  };
}

function browserEngine() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|SamsungBrowser)\//.test(ua)) return 'safari';
  if (/Edg\//.test(ua)) return 'edge';
  if (/(Chrome|Chromium|CriOS)\//.test(ua)) return 'chromium';
  return 'unknown';
}

function autoBuildCandidates(policy = 'stable') {
  if (!pthreadsAvailable()) return SINGLE_THREAD_WASM_BUILD_ORDER;
  const engine = browserEngine();
  if (engine === 'firefox') return FIREFOX_BUILD_ORDER;
  if (engine === 'safari') return policy === 'fastest' ? SAFARI_FASTEST_BUILD_ORDER : SAFARI_STABLE_BUILD_ORDER;
  return policy === 'fastest' ? DEFAULT_FASTEST_BUILD_ORDER : DEFAULT_STABLE_BUILD_ORDER;
}

function pthreadsAvailable() {
  return typeof SharedArrayBuffer !== 'undefined';
}

const BUILD_INFO = {
  avx7: {
    name: 'avx7',
    label: 'AVX7 Relaxed SIMD + pthreads',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: true,
  },
  avx6: {
    name: 'avx6',
    label: 'AVX6 SIMD128 + pthreads',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: true,
  },
  avx6st: {
    name: 'avx6st',
    label: 'AVX6 SIMD128 (single-thread WASM)',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: false,
  },
  avx8: {
    name: 'avx8',
    label: 'Pure JS (legacy / no-WASM)',
    wasm: null,
    glue: 'FHE16Library_wasm.js',
  },
  avx9: {
    name: 'avx9',
    label: 'WASM scalar (no SIMD) + pthreads',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: true,
  },
  avx9st: {
    name: 'avx9st',
    label: 'WASM scalar (single-thread)',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: false,
  },
};

let client = null;

// ═══════════════════════════════════════════════════════════════════════
// SERVER SANDBOX
// 이 클래스가 "서버"에 해당합니다.
//
// Production 전환 시 교체 포인트:
//   initWithSecretKey()   → 서버 시작 시 1회 실행. SK는 서버 메모리에만 존재.
//   enc_* 필드            → GET /api/policy 로 브라우저에 제공 (정적 파일 가능)
//   decryptBit()          → POST /api/result { enc_result } → { bit: 0|1 }
//
// 현재(샌드박스 모드): 브라우저 메모리에서 서버 역할을 시뮬레이션.
// ═══════════════════════════════════════════════════════════════════════
class ServerSandbox {
  constructor() {
    // Demo: worker memory simulates the server. Production: this lives only on the backend.
    this._sk = null;
    // Encrypted policy is safe to ship to the browser; plaintext policy remains backend-only.
    this.enc_hr_threshold      = null;
    this.enc_credit_income_min = null;  // 사전심사 자격: 소득 최솟값
    this.enc_credit_debt_max   = null;  // 사전심사 자격: 부채 최댓값
    this.enc_credit_years_min  = null;  // 사전심사 자격: 재직 최솟값
    this.enc_credit_income_a   = null;  // 한도 Tier A: 소득 최솟값 (높은 기준)
    this.enc_credit_debt_a     = null;  // 한도 Tier A: 부채 최댓값 (낮은 기준)
    this.enc_edr_event_min     = null;
  }

  /**
   * Production: 서버가 FHE16_GenEval 실행 후 SK 보관.
   * EK(35MB)와 enc_policy만 브라우저에 배포.
   */
  initWithSecretKey(sk, fheClient) {
    this._sk = sk;
    this._encryptPolicy(fheClient);
  }

  _encryptPolicy(fhe) {
    postLog('[ServerSandbox] Encrypting policy thresholds...');
    // Demo: these thresholds are created inside the worker. Production: plaintext thresholds never leave backend.
    this.enc_hr_threshold      = fhe.encryptInt(25,  8);   // HR 합격선
    this.enc_credit_income_min = fhe.encryptInt(300, 11);  // 사전심사: 소득 최솟값
    this.enc_credit_debt_max   = fhe.encryptInt(100, 11);  // 사전심사: 부채 최댓값
    this.enc_credit_years_min  = fhe.encryptInt(2,   8);   // 사전심사: 재직 최솟값
    this.enc_credit_income_a   = fhe.encryptInt(450, 11);  // 한도 Tier A: 소득 ≥ 450
    this.enc_credit_debt_a     = fhe.encryptInt(50,  11);  // 한도 Tier A: 부채 ≤ 50
    this.enc_edr_event_min     = fhe.encryptInt(3,   8);   // EDR: 이벤트 임계값
    postLog('[ServerSandbox] Policy encryption complete.');
  }

  /**
   * Production: 브라우저가 enc_result 전송 → 서버가 SK로 복호화 → 0/1만 반환.
   * POST /api/decrypt { enc_result } → { bit: 0|1 }
   * SK는 이 sandbox 밖으로 나가지 않음.
   */
  decryptBit(moduleObj, ptr) {
    const raw = Number(moduleObj._FHE16_DECInt(ptr, this._sk));
    return ((raw % 2) + 2) % 2;
  }
}
// ═══════════════════════════════════════════════════════════════════════
// END SERVER SANDBOX
// ═══════════════════════════════════════════════════════════════════════

self.onmessage = async (event) => {
  const { id, type, payload = {} } = event.data || {};
  try {
    if (type === 'load') {
      client = await loadFHE16(payload);
      reply(id, {
        version: client.version,
        metadata: client.metadata,
      });
      return;
    }

    if (!client) throw new Error('FHE16 worker module is not loaded.');

    if (type === 'generateKeys') {
      const elapsedMs = client.generateKeys();
      reply(id, { elapsedMs });
      return;
    }

    if (type === 'runBinaryOperation') {
      reply(id, client.runBinaryOperation(payload.left, payload.right));
      return;
    }

    if (type === 'runGate') {
      reply(id, client.runGate(payload.op, payload.a, payload.b));
      return;
    }

    if (type === 'runGateBatch') {
      reply(id, client.runGateBatch(payload.rows));
      return;
    }

    if (type === 'runRandomAndBatch') {
      reply(id, client.runRandomAndBatch(payload.count));
      return;
    }

    if (type === 'runArithmetic') {
      reply(id, client.runArithmetic(payload.op, payload.a, payload.b, payload.bits));
      return;
    }

    if (type === 'runComparison') {
      reply(id, client.runComparison(payload.op, payload.a, payload.b, payload.bits));
      return;
    }

    if (type === 'runOp') {
      reply(id, client.runOp(payload.op, payload.a, payload.b, payload.c));
      return;
    }

    if (type === 'poolWarmup') {
      reply(id, client.poolWarmup());
      return;
    }

    if (type === 'getThreadInfo') {
      reply(id, client.getThreadInfo());
      return;
    }

    if (type === 'poolForceHot') {
      reply(id, client.poolForceHot());
      return;
    }

    if (type === 'poolCooldown') {
      reply(id, client.poolCooldown());
      return;
    }

    if (type === 'poolIsHot') {
      reply(id, { isHot: client.poolIsHot() });
      return;
    }

    if (type === 'runBMICheck') {
      reply(id, client.runBMICheck(payload.height_cm, payload.weight_kg));
      return;
    }

    if (type === 'runCreditCheck') {
      reply(id, client.runCreditCheck(payload.income, payload.debt, payload.years));
      return;
    }

    if (type === 'runPrivatePrequalCheck') {
      reply(id, client.runPrivatePrequalCheck(payload.buckets || {}));
      return;
    }

    if (type === 'runEDRCheck') {
      reply(id, client.runEDRCheck(payload.features || {}));
      return;
    }

    if (type === 'runHRScreen') {
      reply(id, client.runHRScreen(payload.scores));
      return;
    }

    if (type === 'saveEvalKey') {
      const bytes = client.saveEvalKey();
      reply(id, { bytes });
      return;
    }

    if (type === 'runDeal') {
      reply(id, client.runDeal(payload.clientSeed));
      return;
    }

    if (type === 'runPokerShowdown') {
      reply(id, client.runPokerShowdown(payload.scoreA8, payload.community));
      return;
    }

    if (type === 'runFpOp') {
      reply(id, client.runFpOp(payload.op, payload.a, payload.b, payload.fptype));
      return;
    }

    throw new Error(`Unknown FHE16 worker command: ${type}`);
  } catch (error) {
    replyError(id, error);
  }
};

async function loadFHE16(options) {
  postLog(`[FHE16 worker] MOD_CNT=${FHE16_JS_MOD_CNT}`);
  const baseUrl = normalizeBaseUrl(options.baseUrl || new URL('../', self.location.href));
  const selected = await detectFHE16Build({ ...options, baseUrl });
  const { build, info, wasmUrl, wasmBinary } = selected;
  const glueUrl = new URL(`${build}/${info.glue}`, baseUrl);
  const threadPolicy = resolveThreadPolicy(options.threadCount, Boolean(info.pthreads));
  const pthreadPoolSize = info.pthreads ? threadPolicy.effective + 1 : 0;

  installWorkerShims();

  const moduleObject = {
    // wasmBinary omitted for avx8 (pure JS glue is self-contained).
    ...(wasmBinary ? { wasmBinary } : {}),
    // One slot executes PROXY_TO_PTHREAD main(); the rest are the effective
    // FHE workers selected for this device/request. The generated glue reads
    // this before it pre-spawns its Emscripten pool.
    ...(info.pthreads ? { fhe16PthreadPoolSize: pthreadPoolSize } : {}),
    noInitialRun: true,   // don't call main() — avoids ABORT=true from exitJS
    noExitRuntime: true,  // keep runtime alive for repeated C API calls
    // pthreads builds: sub-Workers must importScripts the glue, not self.location.
    ...(info.pthreads ? { mainScriptUrlOrBlob: cacheBust(glueUrl.href) } : {}),
    locateFile: (path) => {
      if (info.wasm && path === info.wasm) return cacheBust(wasmUrl.href);   // bust .wasm cache too
      return cacheBust(new URL(`${build}/${path}`, baseUrl).href);
    },
    print: (text) => postLog(text),
    printErr: (text) => postLog(text),
    setStatus: (text) => {
      if (text) postStatus(text);
    },
  };

  await new Promise((resolve, reject) => {
    moduleObject.onRuntimeInitialized = resolve;
    moduleObject.onAbort = (reason) => reject(new Error(String(reason || 'WASM aborted')));
    self.Module = moduleObject;
    importScripts(cacheBust(glueUrl.href));
  });
  if (!moduleObject.FS && typeof self.FS !== 'undefined') moduleObject.FS = self.FS;

  const actualPthreads = typeof SharedArrayBuffer !== 'undefined'
    && moduleObject.HEAPU8?.buffer instanceof SharedArrayBuffer;
  if (Boolean(info.pthreads) !== actualPthreads) {
    throw new Error(`${build} artifact mismatch: metadata pthreads=${Boolean(info.pthreads)}, shared memory=${actualPthreads}`);
  }
  // Apply the native count as soon as the runtime exists. Delaying this until
  // generateKeys() lets getThreadInfo()/poolWarmup() observe the compiled
  // default (up to 16), which can exceed the device-sized Emscripten pool.
  if (actualPthreads && typeof moduleObject._FHE16_SetThreadCount === 'function') {
    moduleObject._FHE16_SetThreadCount(threadPolicy.effective);
  }

  // avx6/avx7/avx9 WASM builds use WASM_BIGINT=1, so _FHE16_ENCInt has
  // type (i64, i32) → i32*. Browsers without WASM BigInt i64 integration silently
  // omit i64-typed exports from instance.exports, so Module["asm"]["Ba"] is
  // undefined and the lazy wrapper throws "Cannot read properties of undefined
  // (reading 'apply')". Fall back to _FHE16_ENCInt_Arr(int32_t* bits, int32_t n)
  // which encodes the integer as an array of n LSB-first bit values (each 0 or 1).
  if (typeof moduleObject._FHE16_ENCInt === 'function') {
    const asm = moduleObject['asm'];
    const i64ExportMissing = !asm || typeof asm['Ba'] !== 'function';
    // avx8 (wasm2js, pure JS) cannot accept i64/BigInt args → always use the bit-array encoder.
    if ((build === 'avx8' || i64ExportMissing) && typeof moduleObject._FHE16_ENCInt_Arr === 'function') {
      postLog('[FHE16] using _FHE16_ENCInt_Arr (avx8 or WASM BigInt i64 unavailable) — avoids BigInt mix error');
      const _encIntArr = moduleObject._FHE16_ENCInt_Arr;
      const _malloc    = moduleObject._malloc;
      const _free      = moduleObject._free;
      moduleObject._FHE16_ENCInt = (msg, bits) => {
        const n   = bits | 0;
        const val = Number(msg);
        const ptr = _malloc(n * 4);
        const h   = moduleObject.HEAP32;
        const idx = ptr >>> 2;
        for (let i = 0; i < n; i++) h[idx + i] = (val >> i) & 1;
        const ct = _encIntArr(ptr, n);
        _free(ptr);
        return ct;
      };
    }
  }

  return new WorkerFHE16Client(moduleObject, {
    build,
    label: info.label,
    pthreads: actualPthreads,
    wasmUrl: wasmUrl ? wasmUrl.href : null, // null for avx8 (pure JS)
    glueUrl: glueUrl.href,
  }, {
    threadPolicy,
    includeCiphertextBytes: options.includeCiphertextBytes === true,
  });
}

async function detectFHE16Build(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const requested = options.build || 'auto';
  const policy = options.policy || 'stable';
  const candidates = requested === 'auto' ? autoBuildCandidates(policy) : [requested];

  // Warn early if pthreads builds might fail due to missing COOP/COEP headers.
  const needsPthreads = candidates.some(b => BUILD_INFO[b]?.pthreads);
  if (needsPthreads && typeof self.crossOriginIsolated !== 'undefined' && !self.crossOriginIsolated) {
    postLog(
      '[FHE16 WARNING] COOP/COEP headers missing — SharedArrayBuffer is disabled in this browser.\n' +
      'Multi-threaded builds (avx7/avx6/avx9) require these HTTP response headers:\n' +
      '  Cross-Origin-Opener-Policy: same-origin\n' +
      '  Cross-Origin-Embedder-Policy: require-corp\n' +
      'Your server does not set these headers. Use serve.py (port 8765):\n' +
      '  python3 serve.py\n' +
      'Auto mode uses avx6st/avx9st real-WASM fallbacks before avx8; an explicitly forced pthread build will fail.'
    );
  }

  for (const build of candidates) {
    const info = BUILD_INFO[build];
    if (!info) throw new Error(`Unknown FHE16 build: ${build}`);
    // pthreads builds require SharedArrayBuffer (COOP/COEP headers).
    if (info.pthreads && !pthreadsAvailable()) {
      postLog(`Skipped ${info.label}: SharedArrayBuffer not available (COOP/COEP headers required)`);
      if (requested !== 'auto') throw new Error('SharedArrayBuffer not available');
      continue;
    }
    // avx8: pure-JS glue, no WASM compile needed.
    if (info.wasm === null) {
      return { build, info, wasmUrl: null, wasmBinary: null };
    }
    if (typeof WebAssembly === 'undefined') {
      const error = new Error('WebAssembly is unavailable');
      if (requested !== 'auto') throw error;
      postLog(`Skipped ${info.label}: ${error.message}`);
      continue;
    }
    const wasmUrl = new URL(`${build}/${info.wasm}`, baseUrl);
    try {
      const wasmBinary = await fetchBytes(cacheBust(wasmUrl.href));   // version-busted .wasm fetch
      if (typeof WebAssembly.validate === 'function') {
        if (!WebAssembly.validate(wasmBinary)) throw new Error(`${info.label} is unsupported by this engine`);
      } else {
        await WebAssembly.compile(wasmBinary);
      }
      return { build, info, wasmUrl, wasmBinary };
    } catch (error) {
      if (requested !== 'auto') throw error;
      postLog(`Skipped ${info.label}: ${error.message}`);
    }
  }

  throw new Error('No compatible FHE16 build is available in this environment.');
}

// ── Plain-JS 7-card hand evaluator (server-side, no FHE) ─────────────────────
// Returns score8 = (category<<4)|top_rank — matches poker.js (score >> 16) & 0xFF
function _evalHand7(cards) {
  const rc = new Array(13).fill(0);
  const sc = new Array(4).fill(0);
  const sb = [[], [], [], []];
  for (const c of cards) { rc[c.r]++; sc[c.s]++; sb[c.s].push(c.r); }
  const strHigh = (ranks) => {
    const s = new Set(ranks);
    for (let h = 12; h >= 4; h--)
      if (s.has(h) && s.has(h-1) && s.has(h-2) && s.has(h-3) && s.has(h-4)) return h;
    if (s.has(12) && s.has(0) && s.has(1) && s.has(2) && s.has(3)) return 3;
    return -1;
  };
  const flushS = sc.findIndex(c => c >= 5);
  const sfH = flushS >= 0 ? strHigh(sb[flushS]) : -1;
  const stH = strHigh(cards.map(c => c.r));
  const r4 = [], r3 = [], r2 = [];
  for (let r = 12; r >= 0; r--) {
    if (rc[r] === 4) r4.push(r);
    else if (rc[r] === 3) r3.push(r);
    else if (rc[r] === 2) r2.push(r);
  }
  if (sfH >= 0)               return (8 << 4) | sfH;
  if (r4.length)              return (7 << 4) | r4[0];
  if (r3.length && r2.length) return (6 << 4) | r3[0];
  if (flushS >= 0)            return (5 << 4) | Math.max(...sb[flushS]);
  if (stH >= 0)               return (4 << 4) | stH;
  if (r3.length)              return (3 << 4) | r3[0];
  if (r2.length >= 2)         return (2 << 4) | r2[0];
  if (r2.length === 1)        return (1 << 4) | r2[0];
  return (0 << 4) | Math.max(...cards.map(c => c.r));
}

class WorkerFHE16Client {
  constructor(moduleObject, metadata, options = {}) {
    this.module = moduleObject;
    this.includeCiphertextBytes = options.includeCiphertextBytes === true;
    this.metadata = {
      ...metadata,
      includeCiphertextBytes: this.includeCiphertextBytes,
    };
    this.keysReady = false;
    this.keyGenerationStarted = false;
    this.threadPolicy = options.threadPolicy
      || resolveThreadPolicy(options.threadCount, this.metadata.pthreads);
    this.hardwareConcurrency = this.threadPolicy.hardwareConcurrency;
    this.requestedThreadCount = this.threadPolicy.effective;
    this.version = this.readVersion();
    // 브라우저 측 클라이언트. server sandbox가 SK/policy를 보관.
    this.server = new ServerSandbox();
  }

  readVersion() {
    if (!this.module._FHE16_Version) return 'FHE16';
    const ptr = this.module._FHE16_Version();
    return ptr ? this.readCString(ptr) : 'FHE16';
  }

  readCString(ptr) {
    const bytes = this.module.HEAPU8;
    let end = ptr;
    while (bytes[end] !== 0) end += 1;
    // .slice() copies to a regular ArrayBuffer — TextDecoder rejects SharedArrayBuffer views (pthreads builds).
    return new TextDecoder().decode(bytes.slice(ptr, end));
  }

  generateKeys() {
    if (this.keyGenerationStarted) {
      throw new Error('FHE16 generateKeys() may be called only once per Worker. Create a new Worker for a new evaluation context.');
    }
    // Fail closed before entering C++: teardown currently stops pool workers,
    // but does not guarantee complete scratch-context reuse after a partial run.
    this.keyGenerationStarted = true;
    const started = performance.now();
    // Pure-JS avx8 has no pthread runtime. Setting its count from navigator would
    // only make the diagnostic getter claim multiple threads while execution stays inline.
    if (this.metadata.pthreads && typeof this.module._FHE16_SetThreadCount === 'function') {
      this.module._FHE16_SetThreadCount(this.requestedThreadCount);
    }
    // Production: 서버가 GenEval 실행. SK는 server sandbox가 보관.
    const sk = this.module._FHE16_GenEval();
    if (!sk) {
      throw new Error('FHE16_GenEval() failed to create an evaluation context. Create a new Worker before retrying.');
    }
    // Server policy setup encrypts through this client and therefore needs the
    // native key context to be visible to assertKeys(). Keep the externally
    // observable state fail-closed if that setup itself throws.
    this.keysReady = true;
    try {
      this.server.initWithSecretKey(sk, this); // 서버: SK 수신 + policy 암호화
    } catch (error) {
      this.keysReady = false;
      throw error;
    }
    return performance.now() - started;
  }

  poolWarmup() {
    const started = performance.now();
    this.module._FHE16_PoolWarmup();
    return { elapsedMs: performance.now() - started };
  }

  getThreadInfo() {
    const runtimeReportedThreadCount = typeof this.module._FHE16_GetThreadCount === 'function'
      ? Number(this.module._FHE16_GetThreadCount())
      : this.requestedThreadCount;
    const hotWorkerCount = typeof this.module._FHE16_GetHotWorkerCount === 'function'
      ? Number(this.module._FHE16_GetHotWorkerCount())
      : 0;
    return {
      build: this.metadata.build,
      pthreads: this.metadata.pthreads,
      hardwareConcurrency: this.hardwareConcurrency,
      requestedThreadCount: this.requestedThreadCount,
      threadPolicy: this.threadPolicy,
      threadCount: this.metadata.pthreads ? Math.max(1, runtimeReportedThreadCount) : 1,
      runtimeReportedThreadCount,
      hotWorkerCount,
      pthreadPoolSize: this.metadata.pthreads ? this.requestedThreadCount + 1 : 0,
      linearMemoryBytes: this.module.HEAPU8?.buffer?.byteLength || 0,
    };
  }

  poolForceHot() {
    const started = performance.now();
    this.module._FHE16_PoolForceHot();
    const reportedThreadCount = this.module._FHE16_GetThreadCount();
    const threadCount = this.metadata.pthreads ? Math.max(1, reportedThreadCount) : 1;

    // JIT warmup: run one ADD and one GE with dummy inputs so V8 TurboFan
    // compiles all hot paths (PrefixAdder threads, PBS, NTT) during Force Hot.
    // Without this, the very first user operation pays a ~2 s Liftoff-JIT penalty.
    const M = this.module;
    let wA = 0, wB = 0, wOut = 0;
    try {
      wA   = M._FHE16_ENCInt(BigInt(0), 32);
      wB   = M._FHE16_ENCInt(BigInt(0), 32);
      if (wA && wB) { wOut = M._FHE16_ADD(wA, wB); if (wOut) { M._FHE16_Free(wOut); wOut = 0; } }
      if (wA && wB) { wOut = M._FHE16_GE(wA, wB);  if (wOut) { M._FHE16_Free(wOut); wOut = 0; } }
    } finally {
      if (wA)   M._FHE16_Free(wA);
      if (wB)   M._FHE16_Free(wB);
      if (wOut) M._FHE16_Free(wOut);
    }

    return {
      elapsedMs: performance.now() - started,
      ...this.getThreadInfo(),
      threadCount,
    };
  }

  poolCooldown() {
    const started = performance.now();
    this.module._FHE16_PoolCooldown();
    return { elapsedMs: performance.now() - started };
  }

  poolIsHot() {
    return this.module._FHE16_PoolIsHot() !== 0;
  }

  encryptBit(value) {
    this.assertKeys();
    // FHE16_ENCInt(int64_t msg, int32_t bits). Emscripten WASM_BIGINT=1 takes
    // i64 as JS BigInt. avx8 is shimmed at load time to accept BigInt too.
    return this.module._FHE16_ENCInt(BigInt(value ? 1 : 0), 1);
  }

  encryptInt(value, bits) {
    this.assertKeys();
    return this.module._FHE16_ENCInt(BigInt(value), bits | 0);
  }

  // _FHE16_AND is the single-bit Boolean AND used by the bench/demo gate.
  andCiphertextsRaw(leftPtr, rightPtr) {
    return this.module._FHE16_AND(leftPtr, rightPtr);
  }

  decryptInt(ciphertextPtr) {
    this.assertKeys();
    // Production: 브라우저가 enc_result를 서버에 전송, 서버가 SK로 복호화 후 0/1만 반환.
    return Number(this.module._FHE16_DECInt(ciphertextPtr, this.server._sk));
  }

  decryptBit(ptr) {
    return ((this.decryptInt(ptr) % 2) + 2) % 2;
  }

  runGate(op, a_bit, b_bit) {
    this.assertKeys();
    const a = this.encryptBit(a_bit);
    const needsB = op !== 'NEG';
    const b = needsB ? this.encryptBit(b_bit) : 0;
    // For NOT gate: encrypt constant 1 to XOR with (FHE16_NEG is arithmetic, not bitwise NOT)
    const one = (op === 'NEG') ? this.encryptBit(1) : 0;
    let out = 0;
    try {
      const started = performance.now();
      if (op === 'AND') out = this.module._FHE16_AND(a, b);
      else if (op === 'OR') out = this.module._FHE16_OR(a, b);
      else if (op === 'XOR') out = this.module._FHE16_XOR(a, b);
      else if (op === 'NEG') out = this.module._FHE16_XOR(a, one);
      else throw new Error(`Unknown gate: ${op}`);
      const gateMs = performance.now() - started;
      const result = this.decryptBit(out);
      const expected = gateExpected(op, a_bit, b_bit);
      return { left: a_bit, right: b_bit, result, expected, pass: result === expected, gateMs };
    } finally {
      this.free(a);
      if (b) this.free(b);
      if (one) this.free(one);
      this.free(out);
    }
  }

  runArithmetic(op, a_int, b_int, bits = 8) {
    this.assertKeys();
    const a = this.encryptInt(a_int, bits);
    const b = this.encryptInt(b_int, bits);
    let out = 0;
    try {
      const started = performance.now();
      if (op === 'ADD') out = this.module._FHE16_ADD(a, b);
      else if (op === 'SUB') out = this.module._FHE16_SUB(a, b);
      else throw new Error(`Unknown arithmetic op: ${op}`);
      const opMs = performance.now() - started;
      const result = this.decryptInt(out);
      const mask = (1 << bits) - 1;
      const expected = arithExpected(op, a_int, b_int, mask);
      return { a: a_int, b: b_int, result, expected, pass: result === expected, opMs };
    } finally {
      this.free(a); this.free(b); this.free(out);
    }
  }

  runComparison(op, a_int, b_int, bits = 8) {
    this.assertKeys();
    const a = this.encryptInt(a_int, bits);
    let out = 0;
    try {
      const started = performance.now();
      const bConst = b_int | 0;
      if (op === 'GT') out = this.module._FHE16_GT_CONSTANT_I32(a, bConst);
      else if (op === 'LT') out = this.module._FHE16_LT_CONSTANT_I32(a, bConst);
      else if (op === 'GE') out = this.module._FHE16_GE_CONSTANT_I32(a, bConst);
      else if (op === 'LE') out = this.module._FHE16_LE_CONSTANT_I32(a, bConst);
      else throw new Error(`Unknown comparison op: ${op}`);
      const opMs = performance.now() - started;
      const result = this.decryptBit(out);
      const expected = cmpExpected(op, a_int, b_int);
      return { a: a_int, b: b_int, result, expected, pass: result === expected, opMs };
    } finally {
      this.free(a); this.free(out);
    }
  }

  runBMICheck(height_cm, weight_kg) {
    this.assertKeys();
    const h = height_cm / 100;
    const thresh_under = Math.ceil(18.5 * h * h);
    const thresh_over  = Math.floor(25.0 * h * h);
    const thresh_obese = Math.floor(30.0 * h * h);
    const bits = 8;
    const started = performance.now();
    const enc_w = this.encryptInt(weight_kg, bits);
    let p_under = 0, p_over = 0, p_obese = 0;
    try {
      p_under = this.module._FHE16_LT_CONSTANT_I32(enc_w, thresh_under | 0);
      p_over  = this.module._FHE16_GE_CONSTANT_I32(enc_w, thresh_over  | 0);
      p_obese = this.module._FHE16_GE_CONSTANT_I32(enc_w, thresh_obese | 0);
      const computeMs = performance.now() - started;
      const is_under = this.decryptBit(p_under);
      const is_over  = this.decryptBit(p_over);
      const is_obese = this.decryptBit(p_obese);
      let category;
      if (is_obese) category = 'obese';
      else if (is_over) category = 'overweight';
      else if (is_under) category = 'underweight';
      else category = 'normal';
      return { category, computeMs, thresh_under, thresh_over, thresh_obese };
    } finally {
      this.free(enc_w); this.free(p_under); this.free(p_over); this.free(p_obese);
    }
  }

  runCreditCheck(income, debt, years) {
    this.assertKeys();
    const started = performance.now();
    // Demo runtime guardrail: avoid encrypted integer comparison in the browser.
    // Production: issuer/API or backend policy service creates signed predicate labels;
    // the browser receives encrypted labels and only composes the decision circuit.
    postLog('STEP:1');
    const enc_income_ok = this.encryptBit(income >= 300);
    postLog('STEP:2');
    const enc_debt_ok = this.encryptBit(debt <= 100);
    postLog('STEP:3');
    const enc_years_ok = this.encryptBit(years >= 2);
    const enc_tier_income = this.encryptBit(income >= 450);
    const enc_tier_debt = this.encryptBit(debt <= 50);

    let p_base = 0, p_result = 0, p_tier_a = 0;
    try {
      postLog('STEP:4 income predicate ready');
      postLog('STEP:5 debt predicate ready');
      postLog('STEP:6 employment predicate ready');
      postLog('STEP:7 AND(income_ok, debt_ok)');
      p_base = this.module._FHE16_AND(enc_income_ok, enc_debt_ok);
      postLog('STEP:8 AND(base, years_ok) + AND(tier_income, tier_debt)');
      p_result = this.module._FHE16_AND(p_base, enc_years_ok);
      p_tier_a = this.module._FHE16_AND(enc_tier_income, enc_tier_debt);

      const computeMs = performance.now() - started;
      const ctInputs = [
        { label: 'enc_income_ok',  bytes: this.getCiphertextInfo(enc_income_ok)?.bytes || null },
        { label: 'enc_debt_ok',    bytes: this.getCiphertextInfo(enc_debt_ok)?.bytes || null },
        { label: 'enc_years_ok',   bytes: this.getCiphertextInfo(enc_years_ok)?.bytes || null },
        { label: 'enc_tier_income',bytes: this.getCiphertextInfo(enc_tier_income)?.bytes || null },
        { label: 'enc_tier_debt',  bytes: this.getCiphertextInfo(enc_tier_debt)?.bytes || null },
      ];
      const ctIntermed = [
        { label: 'AND(income∧debt)',  bytes: this.getCiphertextInfo(p_base)?.bytes || null },
        { label: 'AND(tier_i∧tier_d)',bytes: this.getCiphertextInfo(p_tier_a)?.bytes || null },
      ];
      const ctInfo = this.getCiphertextInfo(p_result);
      const ctFinal = { label: 'enc_approved', bytes: ctInfo?.bytes || null };
      const approved = this.server.decryptBit(this.module, p_result) === 1;
      const isTierA = approved && (this.server.decryptBit(this.module, p_tier_a) === 1);
      const limitBucket = !approved ? 'none' : (isTierA ? 'A' : 'B');
      return { approved, limitBucket, computeMs, ctBytes: ctInfo?.bytes || null, ctInputs, ctIntermed, ctFinal };
    } finally {
      this.free(enc_income_ok); this.free(enc_debt_ok); this.free(enc_years_ok);
      this.free(enc_tier_income); this.free(enc_tier_debt);
      this.free(p_base); this.free(p_result); this.free(p_tier_a);
    }
  }




  runPrivatePrequalCheck(buckets) {
    this.assertKeys();
    const started = performance.now();
    const incomeBucket = Math.max(0, Math.min(7, Number(buckets.incomeBucket || 0)));
    const debtBucket = Math.max(0, Math.min(7, Number(buckets.debtBucket || 0)));
    const employmentBucket = Math.max(0, Math.min(7, Number(buckets.employmentBucket || 0)));

    postLog('STEP:1');
    const enc_income_ok = this.encryptBit(incomeBucket >= 4);
    postLog('STEP:2');
    const enc_debt_ok = this.encryptBit(debtBucket <= 3);
    postLog('STEP:3');
    const enc_employment_ok = this.encryptBit(employmentBucket >= 2);

    let p_and1 = 0, p_result = 0;
    try {
      postLog('STEP:4 predicates ready');
      postLog('STEP:5 AND(income_ok, debt_ok)');
      p_and1 = this.module._FHE16_AND(enc_income_ok, enc_debt_ok);
      postLog('STEP:6 AND(and1, employment_ok)');
      p_result = this.module._FHE16_AND(p_and1, enc_employment_ok);
      const computeMs = performance.now() - started;
      const ctInfo = this.getCiphertextInfo(p_result);
      const approved = this.decryptBit(p_result) === 1;
      const limitBucket = approved ? (incomeBucket >= 6 && debtBucket <= 1 ? 'A' : incomeBucket >= 5 ? 'B' : 'C') : 'none';
      return { approved, limitBucket, computeMs, ctBytes: ctInfo?.bytes || null };
    } finally {
      this.free(enc_income_ok); this.free(enc_debt_ok); this.free(enc_employment_ok);
      this.free(p_and1); this.free(p_result);
    }
  }


  runEDRCheck(features) {
    this.assertKeys();
    const started = performance.now();
    const bit = (name) => Number(Boolean(features[name]));
    const count = Math.max(0, Math.min(7, Number(features.eventCountBucket || 0)));

    postLog('STEP:1');
    const enc_unsigned = this.encryptBit(bit('unsignedBinary'));
    const enc_rare_parent = this.encryptBit(bit('rareParent'));
    const enc_outbound = this.encryptBit(bit('suspiciousOutbound'));
    const enc_priv = this.encryptBit(bit('privilegeEscalation'));
    postLog('STEP:2');
    const enc_script = this.encryptBit(bit('scriptSpawn'));
    const enc_sensitive = this.encryptBit(bit('sensitivePath'));
    const enc_count_high = this.encryptBit(count >= 2);

    let p_chain_a1 = 0, p_chain_a2 = 0;
    let p_chain_b1 = 0, p_chain_b2 = 0, p_chain_b3 = 0;
    let p_alert = 0;

    try {
      postLog('STEP:3 EDR predicates ready');
      postLog('STEP:4 patternA: AND(unsigned, rare_parent)');
      p_chain_a1 = this.module._FHE16_AND(enc_unsigned, enc_rare_parent);
      postLog('STEP:5 patternA: AND(chain_a1, outbound)');
      p_chain_a2 = this.module._FHE16_AND(p_chain_a1, enc_outbound);
      postLog('STEP:6 patternB: AND(script, sensitive_path)');
      p_chain_b1 = this.module._FHE16_AND(enc_script, enc_sensitive);
      postLog('STEP:7 patternB: AND chains');
      p_chain_b2 = this.module._FHE16_AND(p_chain_b1, enc_count_high);
      p_chain_b3 = this.module._FHE16_AND(p_chain_b2, enc_priv);
      postLog('STEP:8 OR(patternA, patternB)');
      p_alert = this.module._FHE16_OR(p_chain_a2, p_chain_b3);

      const computeMs = performance.now() - started;
      const ctInputs = [
        { label: 'enc_unsigned',   bytes: this.getCiphertextInfo(enc_unsigned)?.bytes || null },
        { label: 'enc_rare_parent',bytes: this.getCiphertextInfo(enc_rare_parent)?.bytes || null },
        { label: 'enc_outbound',   bytes: this.getCiphertextInfo(enc_outbound)?.bytes || null },
        { label: 'enc_priv',       bytes: this.getCiphertextInfo(enc_priv)?.bytes || null },
        { label: 'enc_script',     bytes: this.getCiphertextInfo(enc_script)?.bytes || null },
        { label: 'enc_sensitive',  bytes: this.getCiphertextInfo(enc_sensitive)?.bytes || null },
        { label: 'enc_count_high', bytes: this.getCiphertextInfo(enc_count_high)?.bytes || null },
      ];
      const ctIntermed = [
        { label: 'AND(unsigned∧rare_parent)', bytes: this.getCiphertextInfo(p_chain_a1)?.bytes || null },
        { label: 'AND(a1∧outbound)',          bytes: this.getCiphertextInfo(p_chain_a2)?.bytes || null },
        { label: 'AND(script∧sensitive)',     bytes: this.getCiphertextInfo(p_chain_b1)?.bytes || null },
        { label: 'AND(b1∧count_high)',        bytes: this.getCiphertextInfo(p_chain_b2)?.bytes || null },
        { label: 'AND(b2∧priv)',              bytes: this.getCiphertextInfo(p_chain_b3)?.bytes || null },
      ];
      const ctInfo = this.getCiphertextInfo(p_alert);
      const ctFinal = { label: 'enc_alert', bytes: ctInfo?.bytes || null };
      const alert = this.server.decryptBit(this.module, p_alert) === 1;
      const ruleA = this.server.decryptBit(this.module, p_chain_a2) === 1;
      const ruleB = this.server.decryptBit(this.module, p_chain_b3) === 1;
      const severity = ruleB ? 'critical' : (ruleA ? 'high' : 'medium');
      const family = ruleB ? 'script-chain' : (ruleA ? 'lateral-move' : 'none');
      return { alert, severity, family, computeMs, ctBytes: ctInfo?.bytes || null, ctInputs, ctIntermed, ctFinal };
    } finally {
      this.free(enc_unsigned); this.free(enc_rare_parent); this.free(enc_outbound);
      this.free(enc_priv); this.free(enc_script); this.free(enc_sensitive); this.free(enc_count_high);
      this.free(p_chain_a1); this.free(p_chain_a2);
      this.free(p_chain_b1); this.free(p_chain_b2); this.free(p_chain_b3); this.free(p_alert);
    }
  }


  runBinaryOperation(leftBit, rightBit) {
    this.assertKeys();
    const left = this.encryptBit(leftBit);
    const right = this.encryptBit(rightBit);
    let out = 0;

    try {
      const started = performance.now();
      out = this.module._FHE16_AND(left, right);
      const gateMs = performance.now() - started;
      const rawDecrypted = this.decryptInt(out);
      const decrypted = ((rawDecrypted % 2) + 2) % 2;
      const expected = Number(Boolean(leftBit) && Boolean(rightBit));
      return {
        left: Number(Boolean(leftBit)),
        right: Number(Boolean(rightBit)),
        expected,
        decrypted,
        rawDecrypted,
        pass: decrypted === expected,
        gateMs,
      };
    } finally {
      this.free(left);
      this.free(right);
      this.free(out);
    }
  }

  runRandomAndBatch(count = 16) {
    const total = Number(count);
    if (!Number.isSafeInteger(total) || total < 1 || total > 4096) {
      throw new RangeError('Random AND batch count must be an integer from 1 to 4096.');
    }

    const inputs = Array.from({ length: total }, (_, index) => ({
      index,
      left: Math.random() < 0.5 ? 0 : 1,
      right: Math.random() < 0.5 ? 0 : 1,
    }));

    // Make every complete 32-lane chunk exercise bit 31 deterministically.
    // This guards the unsigned JS Number -> BigInt -> 32-bit plaintext path.
    for (let index = 31; index < total; index += 32) {
      inputs[index].left = 1;
      inputs[index].right = 1;
    }

    // wasm2js AVX8 cannot safely execute the multi-bit ANDVEC ABI. Keep its
    // correctness fallback sequential, but still use one outer Worker RPC.
    if (this.metadata.wasmUrl === null || typeof this.module._FHE16_ANDVEC !== 'function') {
      const started = performance.now();
      const rows = inputs.map(({ index, left, right }) => ({
        index,
        ...this.runBinaryOperation(left, right),
      }));
      const passCount = rows.filter((row) => row.pass).length;
      return {
        rows,
        passCount,
        total,
        executionMode: 'sequential-single-rpc',
        chunkCount: total,
        batchMs: performance.now() - started,
      };
    }

    // Pack independent Boolean lanes into 1/2/4/8/16/32-bit ciphertexts.
    // One ANDVEC call per chunk exposes the lanes to the persistent native
    // pool instead of paying one browser RPC and one scalar PBS per row.
    const rows = [];
    let chunkCount = 0;
    let encryptedGateMs = 0;
    const batchStarted = performance.now();
    for (let offset = 0; offset < total;) {
      const remaining = total - offset;
      let width = 1;
      while (width < remaining && width < 32) width <<= 1;
      let leftWord = 0;
      let rightWord = 0;
      const used = Math.min(remaining, width);
      for (let lane = 0; lane < used; lane++) {
        if (inputs[offset + lane].left) leftWord = (leftWord | (1 << lane));
        if (inputs[offset + lane].right) rightWord = (rightWord | (1 << lane));
      }

      let leftCt = 0;
      let rightCt = 0;
      let outCt = 0;
      try {
        leftCt = this.encryptInt(leftWord >>> 0, width);
        rightCt = this.encryptInt(rightWord >>> 0, width);
        const gateStarted = performance.now();
        outCt = this.module._FHE16_ANDVEC(leftCt, rightCt);
        const chunkGateMs = performance.now() - gateStarted;
        encryptedGateMs += chunkGateMs;
        if (!outCt) throw new Error('FHE16_ANDVEC returned null');
        const decoded = this.decryptInt(outCt) >>> 0;
        for (let lane = 0; lane < used; lane++) {
          const input = inputs[offset + lane];
          const decrypted = (decoded >>> lane) & 1;
          const expected = input.left & input.right;
          rows.push({
            ...input,
            expected,
            decrypted,
            rawDecrypted: decrypted,
            // Every row waits for the whole packed gate. Keep gateMs as
            // latency; expose per-lane throughput cost separately.
            gateMs: chunkGateMs,
            amortizedGateMs: chunkGateMs / used,
            chunkGateMs,
            pass: decrypted === expected,
          });
        }
      } finally {
        this.free(leftCt);
        this.free(rightCt);
        this.free(outCt);
      }
      offset += used;
      chunkCount++;
    }
    const passCount = rows.filter((row) => row.pass).length;
    return {
      rows,
      passCount,
      total,
      executionMode: 'packed-andvec',
      chunkCount,
      encryptedGateMs,
      batchMs: performance.now() - batchStarted,
    };
  }

  runGateBatch(rows) {
    this.assertKeys();
    const inputs = normalizeGateBatchRows(rows);
    const M = this.module;

    // AVX8's wasm2js lowering cannot safely execute the multi-bit vector gate
    // ABI.  Keep one outer Worker RPC while evaluating/finalizing scalar rows.
    if (this.metadata.wasmUrl === null ||
        typeof M._FHE16_GATEVEC_MIXED !== 'function') {
      const batchStarted = performance.now();
      const outputRows = inputs.map((input) => {
        const result = this.runGate(input.op, input.a, input.b);
        return {
          ...input,
          expected: result.expected,
          decrypted: result.result,
          gateMs: result.gateMs,
          pass: result.pass,
        };
      });
      return {
        rows: outputRows,
        passCount: outputRows.filter((row) => row.pass).length,
        total: outputRows.length,
        executionMode: 'sequential-single-rpc',
        chunkCount: outputRows.length,
        nativeCallCount: outputRows.length,
        batchMs: performance.now() - batchStarted,
      };
    }

    const outputRows = [];
    let chunkCount = 0;
    let encryptedGateMs = 0;
    const batchStarted = performance.now();
    for (let offset = 0; offset < inputs.length; offset += 32) {
      const used = Math.min(32, inputs.length - offset);
      let leftWord = 0;
      let rightWord = 0;
      for (let lane = 0; lane < used; lane++) {
        const input = inputs[offset + lane];
        if (input.a) leftWord |= (1 << lane);
        if (input.b) rightWord |= (1 << lane);
      }

      let leftCt = 0;
      let rightCt = 0;
      let outCt = 0;
      let opsPtr = 0;
      try {
        // >>>0 is essential when lane 31 is set: the WASM BigInt encoder must
        // receive the unsigned 32-bit word rather than a sign-extended Number.
        leftCt = this.encryptInt(leftWord >>> 0, used);
        rightCt = this.encryptInt(rightWord >>> 0, used);
        opsPtr = M._malloc(used);
        if (!opsPtr) throw new Error('Unable to allocate mixed-gate opcode buffer');
        const opcodes = new Uint8Array(used);
        for (let lane = 0; lane < used; lane++)
          opcodes[lane] = MIXED_GATE_OPCODE[inputs[offset + lane].op];
        M.HEAPU8.set(opcodes, opsPtr);

        const gateStarted = performance.now();
        outCt = M._FHE16_GATEVEC_MIXED(leftCt, rightCt, opsPtr, used);
        const chunkGateMs = performance.now() - gateStarted;
        encryptedGateMs += chunkGateMs;
        if (!outCt) throw new Error('FHE16_GATEVEC_MIXED rejected the packed chunk');
        const decoded = this.decryptInt(outCt) >>> 0;
        for (let lane = 0; lane < used; lane++) {
          const input = inputs[offset + lane];
          const decrypted = (decoded >>> lane) & 1;
          const expected = mixedGateExpected(input.op, input.a, input.b);
          outputRows.push({
            ...input,
            expected,
            decrypted,
            chunkIndex: chunkCount,
            gateMs: chunkGateMs,
            chunkGateMs,
            amortizedGateMs: chunkGateMs / used,
            pass: decrypted === expected,
          });
        }
      } finally {
        this.free(leftCt);
        this.free(rightCt);
        this.free(outCt);
        if (opsPtr) M._free(opsPtr);
      }
      chunkCount++;
    }
    return {
      rows: outputRows,
      passCount: outputRows.filter((row) => row.pass).length,
      total: outputRows.length,
      executionMode: 'packed-mixed-gatevec',
      chunkCount,
      nativeCallCount: chunkCount,
      encryptedGateMs,
      batchMs: performance.now() - batchStarted,
    };
  }

  scaleEncBy(enc, weight) {
    if (weight === 2) return this.module._FHE16_ADD(enc, enc);
    if (weight === 4) {
      const d2 = this.module._FHE16_ADD(enc, enc);
      const d4 = this.module._FHE16_ADD(d2, d2);
      this.free(d2);
      return d4;
    }
    if (weight === 5) {
      const d2 = this.module._FHE16_ADD(enc, enc);
      const d4 = this.module._FHE16_ADD(d2, d2);
      this.free(d2);
      const d5 = this.module._FHE16_ADD(d4, enc);
      this.free(d4);
      return d5;
    }
    throw new Error(`scaleEncBy: unsupported weight ${weight}`);
  }

  runHRScreen(scores) {
    this.assertKeys();
    const started = performance.now();
    const safeScores = Array.from({ length: 5 }, (_, index) => Math.max(0, Math.min(4, Number(scores[index] || 0))));

    postLog('STEP:1');
    const enc_edu_ok = this.encryptBit(safeScores[0] >= 2);
    postLog('STEP:2');
    const enc_exp_ok = this.encryptBit(safeScores[1] >= 2);
    postLog('STEP:3');
    const enc_skill_ok = this.encryptBit(safeScores[2] >= 2);
    postLog('STEP:4');
    const enc_comm_ok = this.encryptBit(safeScores[3] >= 2);
    postLog('STEP:5');
    const enc_team_ok = this.encryptBit(safeScores[4] >= 2);

    let p_left = 0, p_mid = 0, p_right = 0, p_result = 0;
    try {
      postLog('STEP:6 AND(edu_ok, exp_ok)');
      p_left = this.module._FHE16_AND(enc_edu_ok, enc_exp_ok);
      postLog('STEP:7 AND(skill_ok, comm_ok)');
      p_mid = this.module._FHE16_AND(enc_skill_ok, enc_comm_ok);
      postLog('STEP:8 AND(left, mid) + AND(right, team_ok)');
      p_right = this.module._FHE16_AND(p_left, p_mid);
      p_result = this.module._FHE16_AND(p_right, enc_team_ok);
      const computeMs = performance.now() - started;
      const ctInputs = [
        { label: 'enc_edu_ok',   bytes: this.getCiphertextInfo(enc_edu_ok)?.bytes || null },
        { label: 'enc_exp_ok',   bytes: this.getCiphertextInfo(enc_exp_ok)?.bytes || null },
        { label: 'enc_skill_ok', bytes: this.getCiphertextInfo(enc_skill_ok)?.bytes || null },
        { label: 'enc_comm_ok',  bytes: this.getCiphertextInfo(enc_comm_ok)?.bytes || null },
        { label: 'enc_team_ok',  bytes: this.getCiphertextInfo(enc_team_ok)?.bytes || null },
      ];
      const ctIntermed = [
        { label: 'AND(edu∧exp)',    bytes: this.getCiphertextInfo(p_left)?.bytes || null },
        { label: 'AND(skill∧comm)', bytes: this.getCiphertextInfo(p_mid)?.bytes || null },
        { label: 'AND(l∧mid)',      bytes: this.getCiphertextInfo(p_right)?.bytes || null },
      ];
      const ctInfo = this.getCiphertextInfo(p_result);
      const ctFinal = { label: 'enc_result', bytes: ctInfo?.bytes || null };
      const result = this.server.decryptBit(this.module, p_result);
      return { pass: result === 1, computeMs, ctBytes: ctInfo?.bytes || null, ctInputs, ctIntermed, ctFinal };
    } finally {
      this.free(enc_edu_ok); this.free(enc_exp_ok); this.free(enc_skill_ok);
      this.free(enc_comm_ok); this.free(enc_team_ok);
      this.free(p_left); this.free(p_mid); this.free(p_right); this.free(p_result);
    }
  }


  // ─── Poker deal: 2-phase shuffle + FHE-encrypt Player B's hole cards ─────────
  // clientSeed: Uint32Array(52) contributed by Player A's browser.
  // Server XORs it with its own random seed → combined shuffle.
  // Player B's cards are FHE-encrypted here; plaintext never sent to browser.
  runDeal(clientSeed) {
    this.assertKeys();
    const M = this.module;
    const serverSeed = Array.from(crypto.getRandomValues(new Uint32Array(52)));
    const combined = serverSeed.map((v, i) => (v ^ (clientSeed[i] >>> 0)) >>> 0);

    // Fisher-Yates shuffle
    const deck = Array.from({length: 52}, (_, i) => ({ r: i % 13, s: Math.floor(i / 13) }));
    for (let i = 51; i > 0; i--) {
      const j = combined[i] % (i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const holeA    = [deck[0], deck[1]];
    const holeB    = [deck[2], deck[3]];
    const community = [deck[4], deck[5], deck[6], deck[7], deck[8]];

    // Store server-side; never sent to browser until reveal
    this._holeB = holeB;

    // FHE-encrypt Player B's card indices (6-bit) for visual proof
    const encB0 = M._FHE16_ENCInt(BigInt(holeB[0].r + holeB[0].s * 13), 6);
    const encB1 = M._FHE16_ENCInt(BigInt(holeB[1].r + holeB[1].s * 13), 6);
    const ct0 = this.getCiphertextInfo(encB0);
    const ct1 = this.getCiphertextInfo(encB1);
    this.free(encB0);
    this.free(encB1);

    return {
      holeA,
      holeBCiphertexts: [
        { bytes: ct0?.bytes || null },
        { bytes: ct1?.bytes || null },
      ],
      community,
    };
  }

  // ─── Poker showdown: server evaluates Player B's hand, FHE GT comparison ────
  // scoreA8: computed by browser (Player A's hand + community, both known to A).
  // community: public community cards (passed from browser).
  // Server evaluates Player B's hand using stored hole cards, encrypts both
  // scores, runs FHE GT, returns encrypted result + reveal data.
  runPokerShowdown(scoreA8, community) {
    this.assertKeys();
    if (!this._holeB) throw new Error('No deal state — call runDeal first');
    const M = this.module;
    const started = performance.now();

    const holeB = this._holeB;
    this._holeB = null;

    // Server evaluates Player B's hand (plain JS, no FHE needed server-side)
    const scoreB8 = _evalHand7([...holeB, ...community]);

    const encA = M._FHE16_ENCInt(BigInt(scoreA8 & 0xFF), 8);
    const encB = M._FHE16_ENCInt(BigInt(scoreB8 & 0xFF), 8);
    let encResult = 0;
    try {
      postLog('POKER:FHE GT comparison (8-bit encrypted scores)…');
      encResult = M._FHE16_GT(encA, encB);
      const computeMs = performance.now() - started;
      const ctInfo = this.getCiphertextInfo(encResult);
      const aWinsStrict = this.server.decryptBit(M, encResult) === 1;
      return {
        aWins: aWinsStrict,
        tie: scoreA8 === scoreB8,
        scoreB8,
        holeBCards: holeB,
        computeMs,
        ctBytes: ctInfo?.bytes || null,
      };
    } finally {
      this.free(encA);
      this.free(encB);
      this.free(encResult);
    }
  }

  // ─── 32-bit signed integer API (all operations, bits fixed at 32) ───────────

  runOp(op, a, b, c) {
    this.assertKeys();
    const BITS = 32;
    const M = this.module;
    const enc = (v) => M._FHE16_ENCInt(BigInt(v | 0), BITS);
    const dec = (ptr) => Number(M._FHE16_DECInt(ptr, this.server._sk)) | 0;

    // (ct, ct) → ct
    const CC = {
      add:'_FHE16_ADD', sub:'_FHE16_SUB', and:'_FHE16_ANDVEC', or:'_FHE16_ORVEC',
      xor:'_FHE16_XORVEC', ge:'_FHE16_GE', gt:'_FHE16_GT', le:'_FHE16_LE',
      lt:'_FHE16_LT', eq:'_FHE16_EQ', neq:'_FHE16_NEQ', min:'_FHE16_MIN',
      max:'_FHE16_MAX', smull:'_FHE16_SMULL', fmull:'_FHE16_FMULL',
      smod:'_FHE16_SMOD', umod:'_FHE16_UMOD',
    };
    // (ct, i32) → ct  — b is plaintext
    const CI = {
      add_const:'_FHE16_ADD_CONSTANT_I32', sub_const:'_FHE16_SUB_CONSTANT_I32',
      ge_const:'_FHE16_GE_CONSTANT_I32', gt_const:'_FHE16_GT_CONSTANT_I32',
      le_const:'_FHE16_LE_CONSTANT_I32', lt_const:'_FHE16_LT_CONSTANT_I32',
      smull_const:'_FHE16_SMULL_CONSTANT_I32', fmull_const:'_FHE16_FMULL_CONSTANT_I32',
      sdiv_const:'_FHE16_SDIV_CONST', smod_const:'_FHE16_SMOD_CONST',
      div_const:'_FHE16_UDIV_CONST',  mod_const:'_FHE16_UMOD_CONST',
    };
    // (ct, k) → ct  — k is plaintext int (shift/rotate amount)
    const CK = {
      shl:'_FHE16_SHL', shr:'_FHE16_SHR', lshiftl:'_FHE16_LSHIFTL',
      lshiftr:'_FHE16_LSHIFTR', ashiftr:'_FHE16_ASHIFTR',
      rotatel:'_FHE16_ROTATEL', rotater:'_FHE16_ROTATER',
      div_pow2:'_FHE16_DIV_POW2', mod_pow2:'_FHE16_MOD_POW2',
      sdiv_pow2:'_FHE16_SDIV_POW2', smod_pow2:'_FHE16_SMOD_POW2',
    };

    // (i32, ct) → ct  — a is plaintext, b is encrypted
    const IC = {
      const_sdiv:'_FHE16_CONST_SDIV', const_smod:'_FHE16_CONST_SMOD',
      const_udiv:'_FHE16_CONST_UDIV', const_umod:'_FHE16_CONST_UMOD',
    };

    const started = performance.now();
    let ctA = 0, ctB = 0, ctC = 0, res = 0;
    try {
      if (CC[op]) {
        ctA = enc(a); ctB = enc(b);
        res = M[CC[op]](ctA, ctB);
      } else if (CI[op]) {
        ctA = enc(a);
        res = M[CI[op]](ctA, b | 0);
      } else if (IC[op]) {
        ctB = enc(b);
        res = M[IC[op]](a | 0, ctB);
      } else if (CK[op]) {
        ctA = enc(a);
        res = M[CK[op]](ctA, b | 0);
      } else if (op === 'neg') {
        ctA = enc(a); res = M._FHE16_NEG(ctA);
      } else if (op === 'abs') {
        ctA = enc(a); res = M._FHE16_ABS(ctA);
      } else if (op === 'add3') {
        ctA = enc(a); ctB = enc(b); ctC = enc(c);
        res = M._FHE16_ADD3(ctA, ctB, ctC);
      } else if (op === 'sdiv' || op === 'udiv') {
        ctA = enc(a); ctB = enc(b);
        // runOp exposes only the quotient. Passing a remainder out-pointer made
        // the native circuit materialize (and, for SDIV, sign-adjust) a second
        // ciphertext that was immediately freed. The C API explicitly accepts
        // null here, so skip that unobservable work.
        res = op === 'sdiv'
          ? M._FHE16_SDIV(ctA, ctB, 0, 0)
          : M._FHE16_UDIV(ctA, ctB, 0);
      } else {
        throw new Error(`Unknown op: ${op}`);
      }

      if (!res) throw new Error(`${op} returned null`);
      const opMs = performance.now() - started;
      const ctAInfo = ctA ? this.getCiphertextInfo(ctA) : null;
      const ctBInfo = ctB ? this.getCiphertextInfo(ctB) : null;
      const ctCInfo = ctC ? this.getCiphertextInfo(ctC) : null;
      const ctResInfo = this.getCiphertextInfo(res);
      return { value: dec(res), opMs, ctAInfo, ctBInfo, ctCInfo, ctResInfo };
    } finally {
      if (ctA) M._FHE16_Free(ctA);
      if (ctB) M._FHE16_Free(ctB);
      if (ctC) M._FHE16_Free(ctC);
      if (res) M._FHE16_Free(res);
    }
  }

  // CT[0]=NBITS, CT[1]=CT_LENGTH. Header size comes from the compiled binary.
  getCiphertextInfo(ptr, includeBytes = this.includeCiphertextBytes) {
    if (!ptr) return null;
    const M = this.module;
    const hdrWords = M._FHE16_GetCTHeaderSize();
    const nbits = M.HEAP32[ptr >> 2];
    const ctLen = M.HEAP32[(ptr >> 2) + 1];
    const dataWords = nbits * ctLen;
    const dataBytes = dataWords * 4;
    // Metadata header: the first hdrWords int32 (CT_HEADER_SIZE) exposed separately as int32.
    const base = ptr >> 2;
    const header = [];
    for (let i = 0; i < hdrWords; i++) header.push(M.HEAP32[base + i]);
    // Data only (no header). This copy can be very large for 32/64-bit values,
    // so normal compute calls omit it; inspector/demo clients explicitly opt in.
    const bytes = includeBytes
      ? M.HEAPU8.slice(ptr + hdrWords * 4, ptr + (hdrWords + dataWords) * 4)
      : null;
    return { bytes, nbits, ctLen, dataBytes, headerWords: hdrWords, header };
  }

  saveEvalKey() {
    this.assertKeys();
    const M = this.module;
    if (!M.FS || typeof M.FS.readFile !== 'function') {
      throw new Error('Emscripten FS runtime is unavailable; rebuild with FS in EXPORTED_RUNTIME_METHODS.');
    }
    const path = '/fhe16_evalkey.bin';
    const pathPtr = M._malloc(path.length + 1);
    for (let i = 0; i < path.length; i++) M.HEAPU8[pathPtr + i] = path.charCodeAt(i);
    M.HEAPU8[pathPtr + path.length] = 0;
    try {
      const ret = M._FHE16_EvalKeySave(pathPtr);
      if (ret !== 0) throw new Error(`FHE16_EvalKeySave failed (code ${ret})`);
      const data = M.FS.readFile(path);
      return data instanceof Uint8Array ? data.slice() : new Uint8Array(data);
    } finally {
      M._free(pathPtr);
      try { M.FS.unlink(path); } catch (_) {}
    }
  }

  // ─── Float / Double API ───────────────────────────────────────────────
  runFpOp(op, a, b, fptype) {
    this.assertKeys();
    const M = this.module;
    const isDouble = fptype === 'f64';

    const encFp = (v) => isDouble
      ? M._FHE16_ENC_DOUBLE(Number(v))
      : M._FHE16_ENC_FLOAT(Math.fround(Number(v)));

    const decFp = (ptr) => isDouble
      ? M._FHE16_DEC_DOUBLE(ptr, this.server._sk)
      : M._FHE16_DEC_FLOAT(ptr, this.server._sk);

    // op → [wasmFn, arity(1|2), ret('f'=float, 'b'=bool 1-bit)]
    const FP_OPS = {
      fadd:['_FHE16_FADD',2,'f'], fsub:['_FHE16_FSUB',2,'f'],
      fmul:['_FHE16_FMUL',2,'f'], fdiv:['_FHE16_FDIV',2,'f'],
      fmin:['_FHE16_FMIN',2,'f'], fmax:['_FHE16_FMAX',2,'f'],
      fcopysign:['_FHE16_FCOPYSIGN',2,'f'],
      fabs:['_FHE16_FABS',1,'f'], fneg:['_FHE16_FNEG',1,'f'],
      ftrunc:['_FHE16_FTRUNC',1,'f'], ffloor:['_FHE16_FFLOOR',1,'f'],
      fceil:['_FHE16_FCEIL',1,'f'], fround:['_FHE16_FROUND',1,'f'],
      flt:['_FHE16_FLT',2,'b'], fgt:['_FHE16_FGT',2,'b'],
      fle:['_FHE16_FLE',2,'b'], fge:['_FHE16_FGE',2,'b'],
      feq:['_FHE16_FEQ',2,'b'], fne:['_FHE16_FNE',2,'b'],
    };

    const started = performance.now();
    let ctA = 0, ctB = 0, res = 0;
    try {
      const spec = FP_OPS[op];
      if (!spec) throw new Error(`Unknown fp op: ${op}`);
      const fn = spec[0], arity = spec[1], ret = spec[2];
      if (typeof M[fn] !== 'function') throw new Error(`${fn} not exported — rebuild WASM (exported_functions.txt)`);
      ctA = encFp(a);
      if (arity === 2) ctB = encFp(b);
      res = arity === 2 ? M[fn](ctA, ctB) : M[fn](ctA);
      if (!res) throw new Error(`${op} returned null`);
      const opMs = performance.now() - started;
      const value = ret === 'b'
        ? (Number(M._FHE16_DECInt(res, this.server._sk)) & 1)   // comparison → 0/1
        : decFp(res);
      const ctAInfo = this.getCiphertextInfo(ctA);
      const ctBInfo = arity === 2 ? this.getCiphertextInfo(ctB) : null;
      const ctResInfo = this.getCiphertextInfo(res);
      return { value, opMs, ctAInfo, ctBInfo, ctResInfo, arity, ret };
    } finally {
      if (ctA) M._FHE16_Free(ctA);
      if (ctB) M._FHE16_Free(ctB);
      if (res) M._FHE16_Free(res);
    }
  }

  free(ptr) {
    if (ptr) this.module._FHE16_Free(ptr);
  }

  assertKeys() {
    if (!this.keysReady) {
      throw new Error('FHE16 evaluation keys are not ready. Call generateKeys() first.');
    }
  }
}

function normalizeBaseUrl(baseUrl) {
  const url = baseUrl instanceof URL ? baseUrl : new URL(baseUrl, self.location.href);
  return url.href.endsWith('/') ? url : new URL(`${url.href}/`);
}

async function fetchBytes(url) {
  // cacheBust() attaches the release id, so unchanged deployments can reuse
  // the compiled artifact while a version bump still prevents stale mixing.
  const response = await fetch(url, { cache: 'default' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.pathname}: HTTP ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function installWorkerShims() {
  self.__dirname = self.__dirname || '.';
  self.process = self.process || { argv: [], exitCode: 0 };
  self.process.argv = self.process.argv || [];

  self.require = self.require || ((name) => {
    if (name === 'node:fs') {
      return {
        readFileSync() {
          throw new Error('Browser FHE16 worker passes Module.wasmBinary; fs.readFileSync is unavailable.');
        },
      };
    }

    if (name === 'node:crypto' || name === 'crypto') {
      const randomFillSync = (target) => {
        const view = target instanceof Uint8Array
          ? target
          : new Uint8Array(target.buffer || target, target.byteOffset || 0, target.byteLength || target.length);
        for (let offset = 0; offset < view.length; offset += 65536) {
          crypto.getRandomValues(view.subarray(offset, Math.min(offset + 65536, view.length)));
        }
        return target;
      };
      return {
        randomFillSync,
        ad: {
          getRandomValues: (target) => randomFillSync(target),
        },
      };
    }

    throw new Error(`Unsupported browser require(${name})`);
  });
}

function cacheBust(url) {
  const parsed = new URL(url, self.location.href);
  // Version-tagged so a MOD_CNT bump busts BOTH glue and .wasm caches on every deploy.
  parsed.searchParams.set('v', String(FHE16_JS_MOD_CNT));
  return parsed.href;
}

function gateExpected(op, a, b) {
  if (op === 'AND') return Number(Boolean(a) && Boolean(b));
  if (op === 'OR')  return Number(Boolean(a) || Boolean(b));
  if (op === 'XOR') return Number(Boolean(a) !== Boolean(b));
  if (op === 'NEG') return Number(!a);
  return -1;
}

const MIXED_GATE_OPCODE = Object.freeze({ AND: 0, OR: 1, XOR: 2 });

function normalizeGateBatchRows(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Gate batch rows must be an array.');
  if (rows.length < 1 || rows.length > 4096) {
    throw new RangeError('Gate batch must contain from 1 to 4096 rows.');
  }
  return rows.map((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new TypeError(`Gate batch row ${index} must be an object.`);
    }
    if (!Object.prototype.hasOwnProperty.call(MIXED_GATE_OPCODE, row.op)) {
      throw new RangeError(`Gate batch row ${index} has unsupported op; use AND, OR, or XOR.`);
    }
    const bit = (value, field) => {
      if (value === false || value === 0) return 0;
      if (value === true || value === 1) return 1;
      throw new TypeError(`Gate batch row ${index} field ${field} must be Boolean or 0/1.`);
    };
    return { index, op: row.op, a: bit(row.a, 'a'), b: bit(row.b, 'b') };
  });
}

function mixedGateExpected(op, a, b) {
  if (op === 'AND') return a & b;
  if (op === 'OR') return a | b;
  return a ^ b;
}

function arithExpected(op, a, b, mask) {
  if (op === 'ADD') return (a + b) & mask;
  if (op === 'SUB') return (a - b + mask + 1) & mask;
  return 0;
}

function cmpExpected(op, a, b) {
  if (op === 'GT') return Number(a > b);
  if (op === 'LT') return Number(a < b);
  if (op === 'GE') return Number(a >= b);
  if (op === 'LE') return Number(a <= b);
  return -1;
}

function postLog(message) {
  self.postMessage({ type: 'log', message: String(message) });
}

function postStatus(message) {
  self.postMessage({ type: 'status', message: String(message) });
}

function reply(id, result) {
  self.postMessage({ id, ok: true, result });
}

function replyError(id, error) {
  self.postMessage({
    id,
    ok: false,
    error: error?.message || String(error),
  });
}
