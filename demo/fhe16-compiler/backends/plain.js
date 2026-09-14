// 평문 참조 백엔드 — 회로가 맞는지 대조하는 용도.
// 같은 규약을 따르므로 컴파일러는 이걸 쓰는지 FHE16을 쓰는지 모른다.
// 2026-09-14

const MASKS = new Map();
function mask(bits) {
  let m = MASKS.get(bits);
  if (m === undefined) { m = (1n << BigInt(bits)) - 1n; MASKS.set(bits, m); }
  return m;
}

/** 비트폭 안으로 접고 부호를 복원한다. */
function wrap(value, type) {
  if (type.float) return value;
  const bits = BigInt(type.bits);
  let v = BigInt(value) & mask(type.bits);
  if (type.signed && v >> (bits - 1n)) v -= 1n << bits;
  return v;
}

export function createPlainBackend() {
  const val = h => h.value;

  const intBin = fn => (a, b, type) => ({ value: wrap(fn(val(a), val(b)), type), type });
  // 어댑터가 같은 폭으로 0/1 을 내므로 평문도 그렇게 맞춘다
  const cmp = fn => (a, b, type) => ({ value: fn(val(a), val(b)) ? 1n : 0n, type: type || { bits: 32, signed: true, float: false } });
  const fBin = fn => (a, b, type) => ({ value: fn(Number(val(a)), Number(val(b))), type });
  const fCmp = fn => (a, b) => ({ value: fn(Number(val(a)), Number(val(b))) ? 1n : 0n, type: { bits: 1, signed: false, float: false } });
  const fUn = fn => (a, type) => ({ value: fn(Number(val(a))), type });

  return {
    name: 'plain',
    describe: () => '평문 참조 구현 — 암호화 없음',

    encrypt: (value, type) => ({ value: type.float ? Number(value) : wrap(value, type), type }),
    decrypt: (h) => h.value,
    constant: (value, type) => ({ value: type.float ? Number(value) : wrap(value, type), type }),
    free: () => {},

    add: intBin((a, b) => a + b),
    sub: intBin((a, b) => a - b),
    mul: intBin((a, b) => a * b),
    div: intBin((a, b) => (b === 0n ? 0n : a / b)),
    mod: intBin((a, b) => (b === 0n ? 0n : a % b)),
    neg: (a, type) => ({ value: wrap(-val(a), type), type }),
    abs: (a, type) => ({ value: wrap(val(a) < 0n ? -val(a) : val(a), type), type }),

    eq: cmp((a, b) => a === b),
    ne: cmp((a, b) => a !== b),
    lt: cmp((a, b) => a < b),
    le: cmp((a, b) => a <= b),
    gt: cmp((a, b) => a > b),
    ge: cmp((a, b) => a >= b),
    min: intBin((a, b) => (a < b ? a : b)),
    max: intBin((a, b) => (a > b ? a : b)),

    and: intBin((a, b) => a & b),
    or: intBin((a, b) => a | b),
    xor: intBin((a, b) => a ^ b),
    not: (a, type) => ({ value: wrap(~val(a), type), type }),
    shl: intBin((a, b) => a << b),
    shr: intBin((a, b) => a >> b),

    // cond 는 0 또는 1. 원핫 마스킹과 같은 결과를 낸다.
    //   m1 = 0 - c  (참이면 전비트 1)   result = (a & m1) ^ (b & ~m1)
    // 어댑터 기본값과 같은 회로 — e + c·(t − e)
    select: (cond, a, b, type) => {
      if (type.float) return { value: val(cond) ? val(a) : val(b), type };
      const c = BigInt(val(cond));
      return { value: wrap(BigInt(val(b)) + c * (BigInt(val(a)) - BigInt(val(b))), type), type };
    },

    fadd: fBin((a, b) => a + b),
    fsub: fBin((a, b) => a - b),
    fmul: fBin((a, b) => a * b),
    fdiv: fBin((a, b) => (b === 0 ? 0 : a / b)),
    fneg: fUn(a => -a),
    fabs: fUn(Math.abs),
    feq: fCmp((a, b) => a === b),
    fne: fCmp((a, b) => a !== b),
    flt: fCmp((a, b) => a < b),
    fle: fCmp((a, b) => a <= b),
    fgt: fCmp((a, b) => a > b),
    fge: fCmp((a, b) => a >= b),
    fmin: fBin(Math.min),
    fmax: fBin(Math.max),
    ffloor: fUn(Math.floor),
    fceil: fUn(Math.ceil),
    fround: fUn(Math.round),
    ftrunc: fUn(Math.trunc),
  };
}
