// FHE16 어댑터 — 백엔드 규약을 FHE16 WASM 내보내기에 잇는다.
//
// 컴파일러는 이 파일의 존재를 모른다. 규약에 적힌 이름만 부른다.
// 엔진이 바뀌면 같은 규약을 채우는 파일을 하나 더 쓰면 된다.
// 2026-09-14

const DEFAULT_OPS = {
  add: 'FHE16_ADD',      sub: 'FHE16_SUB',      mul: 'FHE16_SMULL',
  div: 'FHE16_SDIV',     mod: 'FHE16_SMOD',     neg: 'FHE16_NEG',    abs: 'FHE16_ABS',
  eq:  'FHE16_EQ',       ne:  'FHE16_NEQ',      lt:  'FHE16_LT',
  le:  'FHE16_LE',       gt:  'FHE16_GT',       ge:  'FHE16_GE',
  min: 'FHE16_MIN',      max: 'FHE16_MAX',
  and: 'FHE16_AND',      or:  'FHE16_OR',       xor: 'FHE16_XOR',
  shl: 'FHE16_SHL',      shr: 'FHE16_SHR',
  fadd: 'FHE16_FADD',    fsub: 'FHE16_FSUB',    fmul: 'FHE16_FMUL',  fdiv: 'FHE16_FDIV',
  fneg: 'FHE16_FNEG',    fabs: 'FHE16_FABS',
  feq: 'FHE16_FEQ',      fne: 'FHE16_FNE',      flt: 'FHE16_FLT',
  fle: 'FHE16_FLE',      fgt: 'FHE16_FGT',      fge: 'FHE16_FGE',
  fmin: 'FHE16_FMIN',    fmax: 'FHE16_FMAX',
  ffloor: 'FHE16_FFLOOR', fceil: 'FHE16_FCEIL',
  fround: 'FHE16_FROUND', ftrunc: 'FHE16_FTRUNC',
};

const UNSIGNED_OVERRIDE = { div: 'FHE16_UDIV', mod: 'FHE16_UMOD' };

export class FHE16BackendError extends Error {}

/**
 * @param {object} module  emscripten Module (avx6~avx9 빌드)
 * @param {object} [options]
 *   options.bigint  BigInt ABI 여부. 기본은 자동 판별
 *   options.opNames 연산 이름 덮어쓰기
 */
export function createFHE16Backend(module, options = {}) {
  if (!module) throw new FHE16BackendError('FHE16 모듈이 필요하다');

  const names = { ...DEFAULT_OPS, ...(options.opNames || {}) };
  const has = n => typeof module['_' + n] === 'function';
  const raw = n => {
    const f = module['_' + n];
    if (typeof f !== 'function') throw new FHE16BackendError(`${n} 가 이 빌드에 없다`);
    return f;
  };

  // wasm2js(avx8) 경로는 int64 를 (lo, hi) 두 인자로 받는다.
  const useBigInt = options.bigint !== undefined
    ? options.bigint
    : (module.__fhe16UseBigInt !== undefined ? module.__fhe16UseBigInt : true);

  // FHE16_GenEval() 이 평가 컨텍스트를 만들고 비밀키 핸들을 돌려준다.
  // DECInt 의 두 번째 인자는 비트폭이 아니라 이 핸들이다.
  let secretKey = options.secretKey ?? null;
  let selectStyle = options.selectStyle || 'arith';

  /** 비트 반전 — 전용 연산이 없으면 전체 1과 XOR 한다. */
  function notOf(a, type) {
    if (has('FHE16_NOT')) return raw('FHE16_NOT')(a);
    const allOnes = encInt(type.signed ? -1n : (1n << BigInt(type.bits)) - 1n, type.bits);
    return raw(names.xor)(a, allOnes);
  }

  // GenEval 은 모듈당 한 번만 부른다. 두 번 부르면 키가 바뀌어
  // 앞서 만든 암호문이 전부 복호되지 않는다.
  function ensureKeys() {
    if (secretKey) return secretKey;
    if (module.__fhe16_sk) { secretKey = module.__fhe16_sk; return secretKey; }
    if (options.threads && has('FHE16_SetThreadCount')) {
      raw('FHE16_SetThreadCount')(options.threads | 0);
    }
    const sk = raw('FHE16_GenEval')();
    if (!sk) throw new FHE16BackendError('FHE16_GenEval 이 평가 컨텍스트를 만들지 못했다');
    secretKey = sk;
    module.__fhe16_sk = sk;
    return sk;
  }

  const encInt = (value, bits) => {
    ensureKeys();
    const v = BigInt(value);
    if (useBigInt) return raw('FHE16_ENCInt')(v, bits | 0);
    const lo = Number(BigInt.asIntN(32, v));
    const hi = Number(BigInt.asIntN(32, v >> 32n));
    return raw('FHE16_ENCInt')(lo, hi, bits | 0);
  };

  const decInt = (ptr) => {
    const out = raw('FHE16_DECInt')(ptr, ensureKeys());
    return typeof out === 'bigint' ? out : BigInt(out);
  };

  const encFloat = (value) => {
    ensureKeys();
    if (has('FHE16_ENC_DOUBLE')) return raw('FHE16_ENC_DOUBLE')(Number(value));
    if (has('FHE16_ENC_FLOAT')) return raw('FHE16_ENC_FLOAT')(Number(value));
    throw new FHE16BackendError('이 빌드에 실수 암호화가 없다');
  };
  const decFloat = (ptr) => {
    const sk = ensureKeys();
    if (has('FHE16_DEC_DOUBLE')) return raw('FHE16_DEC_DOUBLE')(ptr, sk);
    if (has('FHE16_DEC_FLOAT')) return raw('FHE16_DEC_FLOAT')(ptr, sk);
    throw new FHE16BackendError('이 빌드에 실수 복호가 없다');
  };

  const live = new Set();
  const track = ptr => { if (ptr) live.add(ptr); return ptr; };

  /** 이항 연산 — 결과 포인터를 돌려준다. */
  const bin = key => (a, b, type) => {
    let name = names[key];
    if (type && !type.float && !type.signed && UNSIGNED_OVERRIDE[key] && has(UNSIGNED_OVERRIDE[key])) {
      name = UNSIGNED_OVERRIDE[key];
    }
    return track(raw(name)(a, b));
  };
  const un = key => (a) => track(raw(names[key])(a));
  /**
   * 비교 — 결과 폭을 입력과 맞춘다.
   *
   * FHE16 비교 연산은 1비트 폭 암호문을 돌려주고, 폭이 다른 암호문끼리는
   * 산술 연산이 중단된다(2026-09-14 확인). 합류 회로가 조건을 값과 곱하므로
   * 비교 결과는 피연산자와 같은 폭이어야 한다.
   *
   * 그래서 a<b 를 sub(a,b) 의 부호 판정으로 만든다. 폭이 그대로 유지된다.
   */
  /**
   * 비교를 산술로 만든다.
   *
   * FHE16 비교 연산(LT·GT·EQ…)은 일반 정수와 다른 도메인의 암호문을 낸다.
   * 그 결과를 산술에 넣으면 엔진이 중단된다(2026-09-14 실측).
   * 상태 합류가 조건을 값과 섞으므로, 조건은 정수 도메인에 남아야 한다.
   *
   * 그래서 MIN·MAX·ABS 만으로 0/1 을 만든다.
   *
   *   nz(x)      = min(1, abs(x))           x가 0이 아니면 1
   *   eq(a,b)    = 1 − nz(a−b)
   *   ge(a,b)    = 1 − nz(max(a,b) − a)     max 가 a 면 a ≥ b
   */
  const arithCmp = {
    // x가 0이 아니면 1. 0이면 0.
    ne: (a, b, t) => nz(sub(a, b), t),
    eq: (a, b, t) => sub1(nz(sub(a, b), t), t),
    // max(a,b) 가 a 와 같으면 a ≥ b
    ge: (a, b, t) => sub1(nz(sub(max(a, b), a), t), t),
    // max(a,b) 가 b 와 같으면 a ≤ b
    le: (a, b, t) => sub1(nz(sub(max(a, b), b), t), t),
    // a > b  =  (a ≥ b) − (a = b).  둘 다 0/1 이고 ge 가 eq 를 포함하므로 뺄셈으로 충분하다.
    gt: (a, b, t) => sub(arithCmp.ge(a, b, t), arithCmp.eq(a, b, t)),
    lt: (a, b, t) => sub(arithCmp.le(a, b, t), arithCmp.eq(a, b, t)),
  };
  const sub = (a, b) => raw(names.sub)(a, b);
  const max = (a, b) => raw(names.max)(a, b);
  /** x가 0이 아니면 1 — min(1, abs(x)) */
  const nz = (x, t) => raw(names.min)(encInt(1n, t.bits), raw(names.abs)(x));
  /** 1 − c — 0/1 뒤집기 */
  const sub1 = (c, t) => raw(names.sub)(encInt(1n, t.bits), c);

  /**
   * 비교 — FHE16_SELECT 가 있으면 네이티브 연산을 그대로 쓴다.
   *
   * 비교 결과는 일반 정수와 섞이지 않는 도메인이지만, FHE16_SELECT 는
   * 그 도메인을 조건으로 받는다. 2026-09-14 실측으로 확인했다.
   *
   * SELECT 가 없는 빌드에서는 산술로 비교를 만든다. 정확하지만 열 배 비싸다.
   */
  const cmp = key => (a, b, type) => {
    const t = type && !type.float ? type : null;
    const nativeSelect = has('FHE16_SELECT');
    if (t && arithCmp[key] && !nativeSelect && !options.rawCompare) {
      return track(arithCmp[key](a, b, t));
    }
    return track(raw(names[key])(a, b));
  };

  const backend = {
    name: 'fhe16',
    describe: () => `FHE16 WASM · ${useBigInt ? 'BigInt ABI' : 'lo/hi ABI'}`,
    module,

    encrypt(value, type) {
      return track(type.float ? encFloat(value) : encInt(value, type.bits));
    },
    decrypt(handle, type) {
      return type && type.float ? decFloat(handle) : decInt(handle);
    },
    /** 평가 컨텍스트를 미리 만든다. 없으면 첫 암호화 때 자동으로 만들어진다. */
    prepare() { return ensureKeys(); },
    get secretKey() { return secretKey; },
    constant(value, type) {
      return track(type.float ? encFloat(value) : encInt(value, type.bits));
    },
    free(handle) {
      if (handle && has('FHE16_Free')) { raw('FHE16_Free')(handle); live.delete(handle); }
    },
    freeAll() {
      if (!has('FHE16_Free')) { live.clear(); return 0; }
      let n = 0;
      for (const p of live) { try { raw('FHE16_Free')(p); n++; } catch { /* 이미 해제 */ } }
      live.clear();
      return n;
    },
    liveCount: () => live.size,

    add: bin('add'), sub: bin('sub'), mul: bin('mul'),
    div: bin('div'), mod: bin('mod'),
    neg: un('neg'),  abs: un('abs'),
    eq: cmp('eq'), ne: cmp('ne'), lt: cmp('lt'),
    le: cmp('le'), gt: cmp('gt'), ge: cmp('ge'),
    min: bin('min'), max: bin('max'),
    and: bin('and'), or: bin('or'), xor: bin('xor'),
    shl: bin('shl'), shr: bin('shr'),

    /** 비트 반전 — 전용 연산이 없으면 전체 1과 XOR 한다. */
    not(a, type) { return track(notOf(a, type)); },
    /** 선택 회로를 바꾼다. 'mask' 또는 'arith'. */
    setSelectStyle(style) { selectStyle = style; return selectStyle; },
    get selectStyle() { return selectStyle; },

    /**
     * 조건부 선택 — cond 는 0 또는 1인 정수 암호문.
     *
     * 두 가지 회로가 있다. 기본은 원핫 마스킹이다.
     *
     *   마스킹  m1 = 0 − c (참이면 전비트 1)   m0 = ~m1
     *           (t & m1) ^ (e & m0)
     *           두 마스크가 배타적이라 겹치는 비트가 없다. 그래서 덧셈 대신 XOR.
     *           곱셈을 쓰지 않는다 — 부트스트랩이 가장 비싼 연산이 빠진다.
     *
     *   산술    e + c·(t − e)
     *           곱셈 하나가 들어간다. 마스킹이 안 되는 빌드의 대비책.
     */
    select(cond, a, b, type) {
      if (has('FHE16_SELECT')) return track(raw('FHE16_SELECT')(cond, a, b));

      if (type && type.float) {
        // 실수는 비트 마스킹이 성립하지 않는다. 산술로 간다.
        const diff = track(raw(names.fsub)(a, b));
        return track(raw(names.fadd)(b, track(raw(names.fmul)(cond, diff))));
      }

      if (selectStyle === 'mask') {
        // 원핫 마스킹 — m1 = 0−c, m0 = ~m1, (t & m1) ^ (e & m0)
        // 곱셈을 쓰지 않아 더 싸다. 다만 AND·XOR 가 **비트 단위**여야 한다.
        // 이 브라우저 빌드의 FHE16_AND 는 단일 비트 게이트라 쓸 수 없다(2026-09-14 실측).
        const zero = encInt(0n, type.bits);
        const m1 = track(raw(names.sub)(zero, cond));
        const m0 = track(notOf(m1, type));
        const tm = track(raw(names.and)(a, m1));
        const em = track(raw(names.and)(b, m0));
        return track(raw(names.xor)(tm, em));
      }

      // 산술 — e + c·(t − e).  곱셈 하나. 비트 단위 논리 없이 성립한다.
      const diff = track(raw(names.sub)(a, b));
      const scaled = track(raw(names.mul)(cond, diff));
      return track(raw(names.add)(b, scaled));
    },

    fadd: bin('fadd'), fsub: bin('fsub'), fmul: bin('fmul'), fdiv: bin('fdiv'),
    fneg: un('fneg'), fabs: un('fabs'),
    feq: cmp('feq'), fne: cmp('fne'), flt: cmp('flt'),
    fle: cmp('fle'), fgt: cmp('fgt'), fge: cmp('fge'),
    fmin: bin('fmin'), fmax: bin('fmax'),
    ffloor: un('ffloor'), fceil: un('fceil'),
    fround: un('fround'), ftrunc: un('ftrunc'),
  };

  // 이 빌드에 없는 실수 연산은 지워서, 규약 검사가 정직하게 실패하도록 둔다.
  for (const key of ['fadd','fsub','fmul','fdiv','fneg','fabs','feq','fne','flt','fle','fgt','fge','fmin','fmax','ffloor','fceil','fround','ftrunc']) {
    if (!has(names[key])) delete backend[key];
  }

  return backend;
}

/** 이 빌드가 규약의 어느 부분을 채우는지 본다. */
export function inspectFHE16(module) {
  const report = { present: [], missing: [] };
  for (const [key, name] of Object.entries(DEFAULT_OPS)) {
    (typeof module['_' + name] === 'function' ? report.present : report.missing).push(`${key}→${name}`);
  }
  for (const n of ['FHE16_ENCInt', 'FHE16_DECInt', 'FHE16_GenEval', 'FHE16_Free']) {
    (typeof module['_' + n] === 'function' ? report.present : report.missing).push(n);
  }
  return report;
}
