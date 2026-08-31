/* global importScripts */
'use strict';

const FHE16_ASSET_VERSION = '52';

// avx8 (pure JS, no WASM) is the final fallback. Keep this in sync with the
// main dist loaders so self-tests exercise the same adaptive choice.
const DEFAULT_STABLE_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const DEFAULT_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const SAFARI_STABLE_BUILD_ORDER = ['avx6', 'avx9', 'avx7', 'avx8'];
const SAFARI_FASTEST_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const FIREFOX_BUILD_ORDER = ['avx7', 'avx6', 'avx9', 'avx8'];
const SINGLE_THREAD_WASM_BUILD_ORDER = ['avx6st', 'avx9st', 'avx8'];
const FHE16_MAX_WASM_THREADS = 16;
const FHE16_DEFAULT_WASM_THREADS = 8;
const PROGRAM_WORKER_PARAM = 'fhe16-rand-and-program';

function resolveThreadPolicy(requested = 'auto', pthreads = true) {
  const rawHardware = typeof navigator !== 'undefined' ? Number(navigator.hardwareConcurrency) : 1;
  const hardwareConcurrency = Number.isFinite(rawHardware) && rawHardware > 0
    ? Math.floor(rawHardware) : 1;
  const rawMemory = typeof navigator !== 'undefined' ? Number(navigator.deviceMemory) : NaN;
  const deviceMemoryGiB = Number.isFinite(rawMemory) && rawMemory > 0 ? rawMemory : null;
  if (!pthreads) return { mode: 'single-thread-fallback', requested: 1, effective: 1, capacity: 1, hardwareConcurrency, deviceMemoryGiB };
  const capacity = Math.max(1, Math.min(FHE16_MAX_WASM_THREADS,
    hardwareConcurrency > 1 ? hardwareConcurrency - 1 : 1));
  const engine = browserEngine();
  const highEndChromium = (engine === 'chromium' || engine === 'edge')
    && deviceMemoryGiB !== null && deviceMemoryGiB >= 16
    && hardwareConcurrency >= 24;
  // Firefox does not expose navigator.deviceMemory. Installed Firefox 154
  // showed higher packed-batch and ADD8 throughput with 16 FHE workers. Keep
  // the explicit 2/4 GiB ceilings authoritative when memory is reported.
  const highEndFirefox = engine === 'firefox' && hardwareConcurrency >= 32;
  const memoryCeiling = deviceMemoryGiB !== null && deviceMemoryGiB <= 2
    ? 2 : deviceMemoryGiB !== null && deviceMemoryGiB <= 4
      ? 4 : highEndChromium || highEndFirefox
        ? FHE16_MAX_WASM_THREADS : FHE16_DEFAULT_WASM_THREADS;
  const automatic = Math.max(1, Math.min(capacity, memoryCeiling));
  if (requested === undefined || requested === null || requested === 'auto') {
    return { mode: 'auto', requested: 'auto', effective: automatic, capacity, hardwareConcurrency, deviceMemoryGiB };
  }
  const numeric = Number(requested);
  if (!Number.isInteger(numeric) || numeric < 1) throw new TypeError('threadCount must be "auto" or a positive integer');
  return {
    mode: numeric > capacity ? 'explicit-clamped' : 'explicit', requested: numeric,
    effective: Math.min(numeric, capacity), capacity, hardwareConcurrency, deviceMemoryGiB,
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
    wasm: 'TestRandAND_wasm.wasm',
    glue: 'TestRandAND_wasm.js',
    pthreads: true,
  },
  avx6: {
    name: 'avx6',
    label: 'AVX6 SIMD128',
    wasm: 'TestRandAND_wasm.wasm',
    glue: 'TestRandAND_wasm.js',
    pthreads: true,
  },
  avx6st: {
    name: 'avx6st',
    label: 'AVX6 SIMD128 (single-thread WASM)',
    wasm: 'TestRandAND_wasm.wasm',
    glue: 'TestRandAND_wasm.js',
    pthreads: false,
  },
  avx8: {
    name: 'avx8',
    label: 'Pure JS (legacy / no-WASM)',
    wasm: null,
    glue: 'TestRandAND_wasm.js',
  },
  avx9: {
    name: 'avx9',
    label: 'WASM scalar (no SIMD)',
    wasm: 'TestRandAND_wasm.wasm',
    glue: 'TestRandAND_wasm.js',
    pthreads: true,
  },
  avx9st: {
    name: 'avx9st',
    label: 'WASM scalar (single-thread)',
    wasm: 'TestRandAND_wasm.wasm',
    glue: 'TestRandAND_wasm.js',
    pthreads: false,
  },
};

// Keep a responsive coordinator outside the generated Emscripten program.
// Its timer can terminate the program Worker even when generated JS/WASM is
// CPU-bound and cannot service a setTimeout callback on its own event loop.
const isProgramWorker = new URL(self.location.href).searchParams.get(PROGRAM_WORKER_PARAM) === '1';
self.onmessage = isProgramWorker ? runProgramWorker : runCoordinator;

async function runCoordinator(event) {
  const { id, payload = {} } = event.data || {};
  let timeoutMs;
  try {
    timeoutMs = readTimeoutMs(payload);
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
    return;
  }

  const programUrl = new URL(self.location.href);
  programUrl.searchParams.set(PROGRAM_WORKER_PARAM, '1');
  programUrl.searchParams.set('fhe16_rand_program_run', String(Date.now()));
  let programWorker;
  let timeout;

  try {
    programWorker = new Worker(programUrl.href);
    const result = await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        callback(value);
      };

      timeout = setTimeout(() => {
        finish(reject, new Error(`TestRandAND timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      programWorker.onmessage = (messageEvent) => {
        const message = messageEvent.data || {};
        if (message.type === 'log' || message.type === 'status') {
          self.postMessage(message);
          return;
        }
        if (message.id !== id) return;
        if (message.ok) finish(resolve, message.result);
        else finish(reject, new Error(message.error || 'TestRandAND program worker failed'));
      };
      programWorker.onerror = (errorEvent) => {
        errorEvent.preventDefault?.();
        finish(reject, new Error(errorEvent.message || 'TestRandAND program worker crashed'));
      };
      programWorker.onmessageerror = () => {
        finish(reject, new Error('TestRandAND program worker returned an invalid message'));
      };
      programWorker.postMessage({ id, payload });
    });
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  } finally {
    clearTimeout(timeout);
    // terminate() is required even on success: Emscripten may leave helper
    // tasks or pthread Workers reachable after its generated onExit callback.
    programWorker?.terminate();
  }
}

async function runProgramWorker(event) {
  const { id, payload = {} } = event.data || {};
  try {
    const result = await runSelfTest(payload);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  }
}

async function runSelfTest(options) {
  readTimeoutMs(options); // The coordinator owns enforcement; validate here too.
  const baseUrl = normalizeBaseUrl(options.baseUrl || new URL('../', self.location.href));
  const selected = await detectBuild({ ...options, baseUrl });
  const { build, info, wasmUrl, wasmBinary } = selected;
  const glueUrl = new URL(`${build}/${info.glue}`, baseUrl);
  const lines = [];
  const threadPolicy = resolveThreadPolicy(options.threadCount, Boolean(info.pthreads));
  const testKeys = Number(options.testKeys ?? 1);
  if (!Number.isInteger(testKeys) || testKeys < 1) {
    throw new TypeError('testKeys must be a positive integer');
  }

  installShims();
  // The standalone CLI intentionally defaults to a 1024-key stress run.
  // Browser self-test is a bounded smoke test; keep the C++/CLI default intact
  // and select its existing environment-controlled short mode in this Worker.
  const previousTestKeys = self.process.env.FHE16_TEST_M;
  self.process.env.FHE16_TEST_M = String(testKeys);
  let moduleObject;
  try {
    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        callback(value);
      };
      const push = (text) => {
        const line = String(text);
        lines.push(line);
        self.postMessage({ type: 'log', message: line });
      };

      moduleObject = self.Module = {
        // wasmBinary omitted for avx8 (pure-JS glue includes its own memory init).
        ...(wasmBinary ? { wasmBinary } : {}),
        ...(info.pthreads ? { fhe16PthreadPoolSize: threadPolicy.effective + 1 } : {}),
        ...(info.pthreads ? { mainScriptUrlOrBlob: cacheBust(glueUrl.href) } : {}),
        locateFile: (path) => {
          if (info.wasm && path === info.wasm) return cacheBust(wasmUrl.href);
          return cacheBust(new URL(`${build}/${path}`, baseUrl).href);
        },
        print: push,
        printErr: push,
        setStatus: (text) => {
          if (text) self.postMessage({ type: 'status', message: String(text) });
        },
        preRun: [() => {
          const actualPthreads = typeof SharedArrayBuffer !== 'undefined'
            && self.Module.HEAPU8?.buffer instanceof SharedArrayBuffer;
          if (Boolean(info.pthreads) !== actualPthreads) {
            throw new Error(`${build} self-test artifact mismatch: metadata pthreads=${Boolean(info.pthreads)}, shared memory=${actualPthreads}`);
          }
          if (actualPthreads && typeof self.Module._FHE16_SetThreadCount === 'function') {
            self.Module._FHE16_SetThreadCount(threadPolicy.effective);
          }
        }],
        onExit: (code) => {
          if (code === 0) finish(resolve);
          else finish(reject, new Error(`TestRandAND exited with code ${String(code)}`));
        },
        onAbort: (reason) => {
          finish(reject, new Error(String(reason || 'WASM aborted')));
        },
      };

      loadGlueWithModuleBinding(cacheBust(glueUrl.href)).catch((error) => {
        finish(reject, error);
      });
    });

    const summaryLine = [...lines].reverse().find((line) => line.includes('PASS') || line.includes('FAIL')) || '';
    const match = summaryLine.match(/(\d+)\s*\/\s*(\d+)\s*PASS/i);
    const passCount = match ? Number(match[1]) : 0;
    const total = match ? Number(match[2]) : 0;

    return {
      build,
      label: info.label,
      pass: total > 0 && passCount === total,
      passCount,
      total,
      summary: summaryLine,
      lines,
      threadPolicy,
      pthreadPoolSize: info.pthreads ? threadPolicy.effective + 1 : 0,
      testKeys,
      linearMemoryBytes: moduleObject.HEAPU8?.buffer?.byteLength || 0,
    };
  } finally {
    cleanupGeneratedProgram(moduleObject);
    if (self.Module === moduleObject) self.Module = undefined;
    if (previousTestKeys === undefined) delete self.process.env.FHE16_TEST_M;
    else self.process.env.FHE16_TEST_M = previousTestKeys;
  }
}

function readTimeoutMs(options) {
  const timeoutMs = Number(options.timeoutMs ?? 900_000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new TypeError('timeoutMs must be a positive number');
  }
  return timeoutMs;
}

function cleanupGeneratedProgram(moduleObject) {
  try {
    moduleObject?.PThread?.terminateAllThreads?.();
  } catch (_) {}
  if (Array.isArray(moduleObject?.preRun)) moduleObject.preRun.length = 0;
  if (Array.isArray(moduleObject?.postRun)) moduleObject.postRun.length = 0;
}

async function detectBuild(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const requested = options.build || 'auto';
  const policy = options.policy || 'stable';
  const candidates = requested === 'auto' ? autoBuildCandidates(policy) : [requested];

  for (const build of candidates) {
    const info = BUILD_INFO[build];
    if (!info) throw new Error(`Unknown FHE16 test build: ${build}`);
    if (info.pthreads && !pthreadsAvailable()) {
      const error = new Error('SharedArrayBuffer not available (COOP/COEP headers required)');
      if (requested !== 'auto') throw error;
      self.postMessage({ type: 'log', message: `Skipped ${info.label}: ${error.message}` });
      continue;
    }
    // avx8: pure JS — skip the WASM compile probe.
    if (info.wasm === null) {
      return { build, info, wasmUrl: null, wasmBinary: null };
    }
    if (typeof WebAssembly === 'undefined') {
      const error = new Error('WebAssembly is unavailable');
      if (requested !== 'auto') throw error;
      self.postMessage({ type: 'log', message: `Skipped ${info.label}: ${error.message}` });
      continue;
    }
    const wasmUrl = new URL(`${build}/${info.wasm}`, baseUrl);
    try {
      const wasmBinary = await fetchBytes(cacheBust(wasmUrl.href));
      if (typeof WebAssembly.validate === 'function') {
        if (!WebAssembly.validate(wasmBinary)) throw new Error(`${info.label} is unsupported by this engine`);
      } else {
        await WebAssembly.compile(wasmBinary);
      }
      return { build, info, wasmUrl, wasmBinary };
    } catch (error) {
      if (requested !== 'auto') throw error;
      self.postMessage({ type: 'log', message: `Skipped ${info.label}: ${error.message}` });
    }
  }

  throw new Error('No compatible FHE16 TestRandAND build is available in this environment.');
}

function normalizeBaseUrl(baseUrl) {
  const url = baseUrl instanceof URL ? baseUrl : new URL(baseUrl, self.location.href);
  return url.href.endsWith('/') ? url : new URL(`${url.href}/`);
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url.pathname}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function installShims() {
  self.__dirname = self.__dirname || '.';
  self.process = self.process || { argv: [], exitCode: 0 };
  self.process.argv = self.process.argv || [];
  self.process.exitCode = 0;
  // emscripten ENVIRONMENT=node uses process.on/exit/hrtime/env.
  if (!self.process.on) {
    self.process.on = () => {};
  }
  if (!self.process.exit) {
    self.process.exit = () => {};
  }
  if (!self.process.hrtime) {
    self.process.hrtime = () => [0, 0];
  }
  if (!self.process.env) {
    self.process.env = {};
  }
  self.require = self.require || ((name) => {
    if (name === 'node:fs' || name === 'fs') {
      return {
        readFileSync() {
          throw new Error('Browser self-test passes Module.wasmBinary; fs.readFileSync is unavailable.');
        },
      };
    }
    if (name === 'node:path' || name === 'path') {
      return {
        dirname: (p) => (p || '').replace(/\/[^/]*$/, '') || '.',
        normalize: (p) => p,
        join: (...parts) => parts.filter(Boolean).join('/'),
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
      return { randomFillSync, ad: { getRandomValues: (target) => randomFillSync(target) } };
    }
    throw new Error(`Unsupported browser require(${name})`);
  });
}

function cacheBust(url) {
  const parsed = new URL(url, self.location.href);
  parsed.searchParams.set('v', FHE16_ASSET_VERSION);
  return parsed.href;
}

async function loadGlueWithModuleBinding(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${new URL(url).pathname}: HTTP ${response.status}`);
  let source = await response.text();
  source = source.replace('e={$c:function(){', 'e=Object.assign(e,{$c:function(){');
  source = source.replace('};\nvar aa=', '});\nvar aa=');
  Function('self', `"use strict"; var Module = self.Module;\n${source}\n`)(self);
}
