// 공통 부분식 제거 — 같은 연산을 같은 입력으로 두 번 부르면 앞의 결과를 돌려준다.
//
// 백엔드 규약을 그대로 두른 껍데기다. 컴파일러도 어댑터도 모른다.
// 암호문 핸들은 값이 아니라 신원으로 비교한다. 같은 핸들이면 같은 값이다.
// 2026-09-14
import { INT_OPS, FLOAT_OPS } from './backend.js';

const PURE = new Set([...INT_OPS, ...FLOAT_OPS]);

export function memoize(backend, stats = {}) {
  const cache = new Map();
  stats.hits = 0;
  stats.misses = 0;

  const ids = new WeakMap();
  let seq = 0;
  const idOf = v => {
    if (v === null || v === undefined) return 'n';
    if (typeof v === 'object') {
      let id = ids.get(v);
      if (id === undefined) { id = 'h' + (seq++); ids.set(v, id); }
      return id;
    }
    return typeof v + ':' + String(v);
  };
  const typeKey = t => (t ? `${t.bits}${t.signed ? 's' : 'u'}${t.float ? 'f' : ''}` : '-');

  return new Proxy(backend, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function' || typeof prop !== 'string') return value;

      // 상수는 같은 값이면 같은 암호문을 쓴다
      if (prop === 'constant') {
        return function (v, type) {
          const key = `c|${String(v)}|${typeKey(type)}`;
          if (cache.has(key)) { stats.hits++; return cache.get(key); }
          stats.misses++;
          const out = value.call(target, v, type);
          cache.set(key, out);
          return out;
        };
      }
      if (!PURE.has(prop)) return value.bind(target);

      return function (...args) {
        const type = args[args.length - 1];
        const operands = args.slice(0, -1).map(idOf).join(',');
        const key = `${prop}|${operands}|${typeKey(type)}`;
        if (cache.has(key)) { stats.hits++; return cache.get(key); }
        stats.misses++;
        const out = value.apply(target, args);
        cache.set(key, out);
        return out;
      };
    },
  });
}
