// 백엔드 규약 — 컴파일러가 아는 유일한 바깥 세계.
//
// 컴파일러는 FHE16을 직접 호출하지 않는다. 여기 적힌 연산 이름만 부른다.
// 엔진이 바뀌어도 이 규약을 채우는 어댑터 하나만 새로 쓰면 된다.
// 2026-09-14

/** 정수 연산 — 모든 백엔드가 채워야 한다. */
export const INT_OPS = [
  'add', 'sub', 'mul', 'div', 'mod', 'neg', 'abs',
  'eq', 'ne', 'lt', 'le', 'gt', 'ge', 'min', 'max',
  'and', 'or', 'xor', 'not', 'shl', 'shr',
  'select',
];

/** 실수 연산 — 선택 사항. 없으면 컴파일러가 실수 프로그램을 거절한다. */
export const FLOAT_OPS = [
  'fadd', 'fsub', 'fmul', 'fdiv', 'fneg', 'fabs',
  'feq', 'fne', 'flt', 'fle', 'fgt', 'fge', 'fmin', 'fmax',
  'ffloor', 'fceil', 'fround', 'ftrunc',
];

/** 값 수명주기 — 모든 백엔드가 채워야 한다. */
export const CORE_OPS = ['encrypt', 'decrypt', 'constant'];

export class BackendError extends Error {}

/**
 * 어댑터가 규약을 지키는지 확인한다. 컴파일 전에 부른다.
 * @param {object} backend
 * @param {{ requireFloat?: boolean }} [options]
 */
export function validateBackend(backend, options = {}) {
  if (!backend || typeof backend !== 'object') {
    throw new BackendError('백엔드 객체가 필요하다');
  }
  const missing = [];
  for (const op of [...CORE_OPS, ...INT_OPS]) {
    if (typeof backend[op] !== 'function') missing.push(op);
  }
  if (options.requireFloat) {
    for (const op of FLOAT_OPS) {
      if (typeof backend[op] !== 'function') missing.push(op);
    }
  }
  if (missing.length) {
    throw new BackendError(`백엔드에 빠진 연산 ${missing.length}종 — ${missing.join(', ')}`);
  }
  return true;
}

/** 백엔드가 실수를 다루는지 본다. */
export function supportsFloat(backend) {
  return FLOAT_OPS.every(op => typeof backend[op] === 'function');
}

/**
 * 호출 횟수와 시간을 세는 껍데기. 어느 백엔드에도 씌울 수 있다.
 * 규약 자체는 건드리지 않는다.
 */
export function instrument(backend, sink = {}) {
  const counts = sink.counts || (sink.counts = Object.create(null));
  const millis = sink.millis || (sink.millis = Object.create(null));
  const now = (typeof performance !== 'undefined' && performance.now)
    ? () => performance.now()
    : () => Number(process.hrtime.bigint() / 1000n) / 1000;

  return new Proxy(backend, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function' || typeof prop !== 'string') return value;
      return function (...args) {
        const t0 = now();
        const out = value.apply(target, args);
        const record = () => {
          counts[prop] = (counts[prop] || 0) + 1;
          millis[prop] = (millis[prop] || 0) + (now() - t0);
        };
        if (out && typeof out.then === 'function') {
          return out.then(v => { record(); return v; }, e => { record(); throw e; });
        }
        record();
        return out;
      };
    },
  });
}
