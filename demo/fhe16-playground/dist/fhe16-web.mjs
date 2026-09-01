// Bump together with FHE16_JS_MOD_CNT in fhe16-worker.js whenever loader or
// deployed artifacts change. It versions the classic Workers and sidecars so
// production can use normal HTTP caching without mixing releases.
const FHE16_ASSET_VERSION = '58';

// avx8 (pure JS, no WebAssembly) is always the final fallback. Auto mode keeps
// browser-specific ordering so Chrome/Edge, Safari, and Firefox can each pick
// the variant that tends to run best there.
const DEFAULT_STABLE_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const DEFAULT_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const SAFARI_STABLE_BUILD_ORDER = ['avx6', 'avx9', 'avx7', 'avx8'];
const SAFARI_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
// Keep a real pthread build ahead of the single-thread wasm2js fallback on all
// engines. Users can still request avx8 explicitly on legacy/non-isolated pages.
const FIREFOX_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
// These are distinct no-pthread link profiles of the AVX6/AVX9 kernels. They
// are considered only when SharedArrayBuffer is unavailable, before wasm2js.
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

  // The Emscripten pool reserves one slot for PROXY_TO_PTHREAD. The remaining
  // capacity is bounded at build time to avoid creating dozens of Workers on
  // high-core servers. Low-memory devices get a smaller automatic default.
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
    label: 'AVX7 Relaxed SIMD',
    wasm: 'FHE16Library_wasm.wasm',
    glue: 'FHE16Library_wasm.js',
    pthreads: true,
  },
  avx6: {
    name: 'avx6',
    label: 'AVX6 SIMD128',
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
    wasm: null, // emcc -s WASM=0: glue file is self-contained, no .wasm artifact
    glue: 'FHE16Library_wasm.js',
  },
  avx9: {
    name: 'avx9',
    label: 'WASM scalar (no SIMD)',
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

let activeLoad = null;

export async function loadFHE16(options = {}) {
  if (activeLoad) return activeLoad;
  activeLoad = loadFHE16Once(options).catch((error) => {
    activeLoad = null;
    throw error;
  });
  return activeLoad;
}

export async function loadFHE16Worker(options = {}) {
  const client = new FHE16WorkerClient(options);
  await client.ready;
  return client;
}

export function runRandAndSelfTest(options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? 900_000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new TypeError('timeoutMs must be a positive number');
  }
  const workerUrl = options.workerUrl
    ? new URL(options.workerUrl, window.location.href)
    : new URL('./fhe16-rand-and-worker.js', import.meta.url);
  if (!options.workerUrl) workerUrl.searchParams.set('v', FHE16_ASSET_VERSION);
  const worker = new Worker(workerUrl, { type: 'classic' });
  const baseUrl = normalizeBaseUrl(options.baseUrl || new URL('../', import.meta.url)).href;

  return new Promise((resolve, reject) => {
    const id = 1;
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(outerTimeout);
      worker.terminate();
      callback(value);
    };
    // The coordinator enforces timeoutMs around variant detection and the
    // generated program. This outer guard also covers a coordinator script
    // fetch/startup that never reaches its own timer; leave a small delivery
    // grace so the coordinator's more precise error wins normal timeout races.
    const outerTimeout = setTimeout(() => {
      finish(reject, new Error(`FHE16 self-test worker timed out after ${timeoutMs} ms`));
    }, timeoutMs + 1_000);
    worker.addEventListener('message', (event) => {
      const message = event.data;
      if (!message) return;
      if (message.type === 'log') {
        options.onLog?.(message.message);
        return;
      }
      if (message.type === 'status') {
        if (message.message) options.onStatus?.(message.message);
        return;
      }
      if (message.id !== id) return;
      if (message.ok) finish(resolve, message.result);
      else finish(reject, new Error(message.error || 'FHE16 self-test failed'));
    });
    worker.addEventListener('error', (event) => {
      finish(reject, new Error(event.message || 'FHE16 self-test worker failed'));
    });
    worker.addEventListener('messageerror', () => {
      finish(reject, new Error('FHE16 self-test worker returned an invalid message'));
    });
    worker.postMessage({
      id,
      payload: {
        build: options.build || 'auto',
        policy: options.policy || 'stable',
        baseUrl,
        threadCount: options.threadCount ?? 'auto',
        timeoutMs,
        testKeys: options.testKeys ?? 1,
      },
    });
  });
}

export async function detectFHE16Build(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const requested = options.build || 'auto';
  const policy = options.policy || 'stable';
  const candidates = requested === 'auto' ? autoBuildCandidates(policy) : [requested];

  for (const build of candidates) {
    const info = BUILD_INFO[build];
    if (!info) throw new Error(`Unknown FHE16 build: ${build}`);
    if (info.pthreads && !pthreadsAvailable()) {
      const error = new Error('SharedArrayBuffer not available (COOP/COEP headers required)');
      if (requested !== 'auto') throw error;
      options.onLog?.(`Skipped ${info.label}: ${error.message}`);
      continue;
    }
    // avx8 (pure JS, no WebAssembly): skip the compile probe, the glue file
    // is self-contained and runs on any ES5+ engine.
    if (info.wasm === null) {
      return { build, info, wasmUrl: null, wasmBinary: null };
    }
    if (typeof WebAssembly === 'undefined') {
      const error = new Error('WebAssembly is unavailable');
      if (requested !== 'auto') throw error;
      options.onLog?.(`Skipped ${info.label}: ${error.message}`);
      continue;
    }
    const wasmUrl = new URL(`${build}/${info.wasm}`, baseUrl);
    try {
      const wasmBinary = await fetchBytes(cacheBust(wasmUrl.href));
      // Validate feature support without compiling the module twice. Emscripten
      // will perform the one real compilation during instantiation below.
      if (typeof WebAssembly.validate === 'function') {
        if (!WebAssembly.validate(wasmBinary)) throw new Error(`${info.label} is unsupported by this engine`);
      } else {
        await WebAssembly.compile(wasmBinary);
      }
      return { build, info, wasmUrl, wasmBinary };
    } catch (error) {
      if (requested !== 'auto') throw error;
      options.onLog?.(`Skipped ${info.label}: ${error.message}`);
    }
  }

  throw new Error('No compatible FHE16 build is available in this environment.');
}

export function availableFHE16Builds() {
  return Object.values(BUILD_INFO).map((build) => ({ ...build }));
}

async function loadFHE16Once(options) {
  if (typeof window === 'undefined') {
    throw new Error('fhe16-web can only load the browser WASM package in a browser context.');
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const selected = await detectFHE16Build({ ...options, baseUrl });
  const { build, info, wasmUrl, wasmBinary } = selected;
  const glueUrl = new URL(`${build}/${info.glue}`, baseUrl);
  const threadPolicy = resolveThreadPolicy(options.threadCount, Boolean(info.pthreads));

  installBrowserShims();

  const moduleObject = {
    // wasmBinary is omitted for avx8 (pure JS) — the glue file is self-contained.
    ...(wasmBinary ? { wasmBinary } : {}),
    ...(info.pthreads ? { fhe16PthreadPoolSize: threadPolicy.effective + 1 } : {}),
    ...(info.pthreads ? { mainScriptUrlOrBlob: cacheBust(glueUrl.href) } : {}),
    locateFile: (path) => {
      if (info.wasm && path === info.wasm) return cacheBust(wasmUrl.href);
      return cacheBust(new URL(`${build}/${path}`, baseUrl).href);
    },
    print: (text) => options.onLog?.(text),
    printErr: (text) => options.onLog?.(text),
    setStatus: (text) => {
      if (text) options.onStatus?.(text);
    },
  };

  await new Promise((resolve, reject) => {
    moduleObject.onRuntimeInitialized = resolve;
    moduleObject.onAbort = (reason) => reject(new Error(String(reason || 'WASM aborted')));
    window.Module = moduleObject;
    loadClassicScript(cacheBust(glueUrl.href)).catch(reject);
  });
  if (!moduleObject.FS && typeof window.FS !== 'undefined') moduleObject.FS = window.FS;

  const actualPthreads = typeof SharedArrayBuffer !== 'undefined'
    && moduleObject.HEAPU8?.buffer instanceof SharedArrayBuffer;
  if (Boolean(info.pthreads) !== actualPthreads) {
    throw new Error(`${build} artifact mismatch: metadata pthreads=${Boolean(info.pthreads)}, shared memory=${actualPthreads}`);
  }
  if (actualPthreads && typeof moduleObject._FHE16_SetThreadCount === 'function') {
    moduleObject._FHE16_SetThreadCount(threadPolicy.effective);
  }

  return new FHE16Client(moduleObject, {
    build,
    label: info.label,
    pthreads: actualPthreads,
    threadPolicy,
    wasmUrl: wasmUrl ? wasmUrl.href : null, // null for avx8 (pure JS)
    glueUrl: glueUrl.href,
  });
}

export class FHE16Client {
  constructor(moduleObject, metadata) {
    this.module = moduleObject;
    this.metadata = metadata;
    this.keysReady = false;
    this.keyGenerationStarted = false;
    this.version = this.readVersion();
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
    // TextDecoder rejects a view backed by SharedArrayBuffer in current
    // Chromium/Firefox. slice() copies into an ordinary ArrayBuffer.
    return new TextDecoder().decode(bytes.slice(ptr, end));
  }

  generateKeys() {
    if (this.keyGenerationStarted) {
      throw new Error('FHE16 generateKeys() may be called only once per client. Create a new client for a new evaluation context.');
    }
    // Fail closed even if native key generation aborts after partial setup: the
    // C++ runtime does not currently guarantee complete scratch-context reuse.
    this.keyGenerationStarted = true;
    const started = performance.now();
    if (this.metadata.pthreads && typeof this.module._FHE16_SetThreadCount === 'function') {
      this.module._FHE16_SetThreadCount(this.metadata.threadPolicy.effective);
    }
    const sk = this.module._FHE16_GenEval();
    if (!sk) {
      throw new Error('FHE16_GenEval() failed to create an evaluation context. Create a new client before retrying.');
    }
    this.sk = sk;
    this.keysReady = true;
    return performance.now() - started;
  }

  encryptBit(value) {
    this.assertKeys();
    return this._encryptIntRaw(value ? 1 : 0, 1);
  }

  _encryptIntRaw(value, bits) {
    // FHE16_ENCInt(int64_t msg, int32_t bits).
    //   Real WASM (avx6/avx7/avx9/avx6st/avx9st, WASM_BIGINT=1): pass BigInt.
    //   wasm2js / pure-JS (avx8): WASM_BIGINT lowering doesn't accept BigInt
    //     arguments; we fall back to the legalized (lo_i32, hi_i32, bits)
    //     ABI that wasm2js emits in that mode.
    if (this.metadata.wasmUrl === null) {
      const lo = value | 0;
      const hi = value < 0 ? -1 : 0;
      return this.module._FHE16_ENCInt(lo, hi, bits | 0);
    }
    return this.module._FHE16_ENCInt(BigInt(value), bits | 0);
  }

  decryptInt(ciphertextPtr) {
    this.assertKeys();
    return Number(this.module._FHE16_DECInt(ciphertextPtr, this.sk));
  }

  andCiphertexts(leftPtr, rightPtr) {
    this.assertKeys();
    // _FHE16_AND is the single-bit Boolean AND. _FHE16_SMULL is the signed
    // multi-bit multiply (used by encryptInt(...) widths >1); for single-bit
    // gates it dispatches internally to ANDVEC which currently aborts on the
    // wasm2js + emcc 5.x path. Stay on FHE16_AND for the bench/demo.
    return this.module._FHE16_AND(leftPtr, rightPtr);
  }

  runAnd(leftBit, rightBit) {
    this.assertKeys();
    const left = this.encryptBit(leftBit);
    const right = this.encryptBit(rightBit);
    let out = 0;

    try {
      const started = performance.now();
      out = this.andCiphertexts(left, right);
      const gateMs = performance.now() - started;
      const decrypted = this.decryptInt(out);
      const expected = Number(Boolean(leftBit) && Boolean(rightBit));
      return {
        left: Number(Boolean(leftBit)),
        right: Number(Boolean(rightBit)),
        expected,
        decrypted,
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

    if (this.metadata.wasmUrl === null || typeof this.module._FHE16_ANDVEC !== 'function') {
      const started = performance.now();
      const rows = inputs.map(({ index, left, right }) => ({
        index,
        ...this.runAnd(left, right),
      }));
      const passCount = rows.filter((row) => row.pass).length;
      return {
        rows,
        passCount,
        total,
        executionMode: 'sequential-direct',
        chunkCount: total,
        batchMs: performance.now() - started,
      };
    }

    const rows = [];
    let chunkCount = 0;
    let encryptedGateMs = 0;
    const batchStarted = performance.now();
    for (let offset = 0; offset < total;) {
      const remaining = total - offset;
      let width = 1;
      while (width < remaining && width < 32) width <<= 1;
      const used = Math.min(remaining, width);
      let leftWord = 0;
      let rightWord = 0;
      for (let lane = 0; lane < used; lane += 1) {
        if (inputs[offset + lane].left) leftWord |= (1 << lane);
        if (inputs[offset + lane].right) rightWord |= (1 << lane);
      }

      let leftCt = 0;
      let rightCt = 0;
      let outCt = 0;
      try {
        leftCt = this._encryptIntRaw(leftWord | 0, width);
        rightCt = this._encryptIntRaw(rightWord | 0, width);
        const gateStarted = performance.now();
        outCt = this.module._FHE16_ANDVEC(leftCt, rightCt);
        const chunkGateMs = performance.now() - gateStarted;
        encryptedGateMs += chunkGateMs;
        if (!outCt) throw new Error('FHE16_ANDVEC returned null');
        const decoded = this.decryptInt(outCt) >>> 0;
        for (let lane = 0; lane < used; lane += 1) {
          const input = inputs[offset + lane];
          const decrypted = (decoded >>> lane) & 1;
          const expected = input.left & input.right;
          rows.push({
            ...input,
            expected,
            decrypted,
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
      chunkCount += 1;
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

    // wasm2js AVX8 retains one outer/direct invocation but avoids the known
    // unsafe multi-bit vector ABI.  Each scalar result is still freed before
    // moving to the next row.
    if (this.metadata.wasmUrl === null ||
        typeof M._FHE16_GATEVEC_MIXED !== 'function') {
      const batchStarted = performance.now();
      const outputRows = inputs.map((input) => {
        let leftCt = 0;
        let rightCt = 0;
        let outCt = 0;
        try {
          leftCt = this._encryptIntRaw(input.a, 1);
          rightCt = this._encryptIntRaw(input.b, 1);
          const gateStarted = performance.now();
          outCt = M[`_FHE16_${input.op}`](leftCt, rightCt);
          const gateMs = performance.now() - gateStarted;
          if (!outCt) throw new Error(`FHE16_${input.op} returned null`);
          const decrypted = this.decryptInt(outCt) & 1;
          const expected = mixedGateExpected(input.op, input.a, input.b);
          return { ...input, expected, decrypted, gateMs, pass: decrypted === expected };
        } finally {
          this.free(leftCt);
          this.free(rightCt);
          this.free(outCt);
        }
      });
      return {
        rows: outputRows,
        passCount: outputRows.filter((row) => row.pass).length,
        total: outputRows.length,
        executionMode: 'sequential-direct',
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
      for (let lane = 0; lane < used; lane += 1) {
        const input = inputs[offset + lane];
        if (input.a) leftWord |= (1 << lane);
        if (input.b) rightWord |= (1 << lane);
      }

      let leftCt = 0;
      let rightCt = 0;
      let outCt = 0;
      let opsPtr = 0;
      try {
        leftCt = this._encryptIntRaw(leftWord >>> 0, used);
        rightCt = this._encryptIntRaw(rightWord >>> 0, used);
        opsPtr = M._malloc(used);
        if (!opsPtr) throw new Error('Unable to allocate mixed-gate opcode buffer');
        const opcodes = new Uint8Array(used);
        for (let lane = 0; lane < used; lane += 1)
          opcodes[lane] = MIXED_GATE_OPCODE[inputs[offset + lane].op];
        M.HEAPU8.set(opcodes, opsPtr);

        const gateStarted = performance.now();
        outCt = M._FHE16_GATEVEC_MIXED(leftCt, rightCt, opsPtr, used);
        const chunkGateMs = performance.now() - gateStarted;
        encryptedGateMs += chunkGateMs;
        if (!outCt) throw new Error('FHE16_GATEVEC_MIXED rejected the packed chunk');
        const decoded = this.decryptInt(outCt) >>> 0;
        for (let lane = 0; lane < used; lane += 1) {
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
      chunkCount += 1;
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

  free(ptr) {
    if (ptr) this.module._FHE16_Free(ptr);
  }

  assertKeys() {
    if (!this.keysReady) {
      throw new Error('FHE16 evaluation keys are not ready. Call generateKeys() first.');
    }
  }
}

export class FHE16WorkerClient {
  constructor(options = {}) {
    this.options = options;
    this.keysReady = false;
    this.keyGenerationStarted = false;
    this.version = 'FHE16';
    this.metadata = null;
    this.pending = new Map();
    this.nextId = 1;

    const workerUrl = options.workerUrl
      ? new URL(options.workerUrl, window.location.href)
      : new URL('./fhe16-worker.js', import.meta.url);
    if (!options.workerUrl) workerUrl.searchParams.set('v', FHE16_ASSET_VERSION);

    this.worker = new Worker(workerUrl, { type: 'classic' });
    this.worker.addEventListener('message', (event) => this.handleMessage(event.data));
    this.worker.addEventListener('error', (event) => {
      this.rejectAll(new Error(event.message || 'FHE16 worker failed'));
    });

    const baseUrl = normalizeBaseUrl(options.baseUrl || new URL('../', import.meta.url)).href;
    this.ready = this.call('load', {
      build: options.build || 'auto',
      policy: options.policy || 'stable',
      baseUrl,
      threadCount: options.threadCount ?? 'auto',
      // Copying every multi-bit ciphertext out of SharedArrayBuffer can move
      // hundreds of KiB to several MiB per call. Keep it an inspector option.
      includeCiphertextBytes: options.includeCiphertextBytes === true,
    }).then((result) => {
      this.version = result.version;
      this.metadata = result.metadata;
      return this;
    });
  }

  async generateKeys() {
    if (this.keyGenerationStarted) {
      throw new Error('FHE16 generateKeys() may be called only once per Worker client. Create a new FHE16WorkerClient for a new evaluation context.');
    }
    // Set before posting so concurrent callers cannot allocate two native
    // evaluation contexts in the same Worker.
    this.keyGenerationStarted = true;
    const result = await this.call('generateKeys');
    this.keysReady = true;
    return result.elapsedMs;
  }

  async runAnd(leftBit, rightBit) {
    return this.call('runBinaryOperation', {
      left: Number(Boolean(leftBit)),
      right: Number(Boolean(rightBit)),
    });
  }

  async runGate(op, a, b) {
    return this.call('runGate', { op, a: Number(a), b: Number(b) });
  }

  async runArithmetic(op, a, b, bits = 8) {
    return this.call('runArithmetic', { op, a: Number(a), b: Number(b), bits });
  }

  async runComparison(op, a, b, bits = 8) {
    return this.call('runComparison', { op, a: Number(a), b: Number(b), bits });
  }

  // 32-bit signed integer — all FHE16 operations, bits fixed at 32
  async runOp(op, a, b, c) {
    return this.call('runOp', {
      op,
      a: Number(a ?? 0),
      b: Number(b ?? 0),
      c: Number(c ?? 0),
    });
  }

  async poolWarmup() {
    return this.call('poolWarmup', {});
  }

  async getThreadInfo() {
    return this.call('getThreadInfo', {});
  }

  async poolForceHot() {
    return this.call('poolForceHot', {});
  }

  async poolCooldown() {
    return this.call('poolCooldown', {});
  }

  async poolIsHot() {
    const r = await this.call('poolIsHot', {});
    return r.isHot;
  }

  async runBMICheck(height_cm, weight_kg) {
    return this.call('runBMICheck', { height_cm: Number(height_cm), weight_kg: Number(weight_kg) });
  }

  async runCreditCheck(income, debt, years) {
    return this.call('runCreditCheck', { income: Number(income), debt: Number(debt), years: Number(years) });
  }

  async runPrivatePrequalCheck(buckets) {
    return this.call('runPrivatePrequalCheck', { buckets });
  }

  async runEDRCheck(features) {
    return this.call('runEDRCheck', { features });
  }

  async runHRScreen(scores) {
    return this.call('runHRScreen', { scores: scores.map(Number) });
  }

  async saveEvalKey() {
    const result = await this.call('saveEvalKey', {});
    return result.bytes;
  }

  async runDeal(clientSeed) {
    return this.call('runDeal', { clientSeed: Array.from(clientSeed) });
  }

  async runPokerShowdown(scoreA8, community) {
    return this.call('runPokerShowdown', { scoreA8: Number(scoreA8), community });
  }

  // Float / Double FHE operations
  // op: 'fadd' | 'fsub' | 'fmul' | 'fdiv'
  // fptype: 'f32' | 'f64'
  async runFpOp(op, a, b, fptype = 'f32') {
    return this.call('runFpOp', { op, a: Number(a), b: Number(b), fptype });
  }

  async runRandomAndBatch(count = 16) {
    const total = Number(count);
    if (!Number.isSafeInteger(total) || total < 1 || total > 4096) {
      throw new RangeError('Random AND batch count must be an integer from 1 to 4096.');
    }
    return this.call('runRandomAndBatch', { count: total });
  }

  async runGateBatch(rows) {
    return this.call('runGateBatch', { rows: normalizeGateBatchRows(rows) });
  }

  terminate() {
    this.worker.terminate();
    this.rejectAll(new Error('FHE16 worker terminated'));
  }

  call(type, payload = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  handleMessage(message) {
    if (!message) return;
    if (message.type === 'log') {
      this.options.onLog?.(message.message);
      return;
    }
    if (message.type === 'status') {
      if (message.message) this.options.onStatus?.(message.message);
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);

    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error || 'FHE16 worker request failed'));
    }
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }
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

function normalizeBaseUrl(baseUrl = new URL('../', import.meta.url)) {
  const url = baseUrl instanceof URL ? baseUrl : new URL(baseUrl, window.location.href);
  return url.href.endsWith('/') ? url : new URL(`${url.href}/`);
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.pathname}: HTTP ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function installBrowserShims() {
  window.__dirname = window.__dirname || '.';
  window.process = window.process || { argv: [], exitCode: 0 };
  window.process.argv = window.process.argv || [];

  window.require = window.require || ((name) => {
    if (name === 'node:fs') {
      return {
        readFileSync() {
          throw new Error('Browser FHE16 loader passes Module.wasmBinary; fs.readFileSync is unavailable.');
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

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function cacheBust(url) {
  const parsed = new URL(url, window.location.href);
  parsed.searchParams.set('v', FHE16_ASSET_VERSION);
  return parsed.href;
}
