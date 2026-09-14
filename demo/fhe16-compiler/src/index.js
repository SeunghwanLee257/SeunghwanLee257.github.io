// 공개 진입점 — 바깥에서 쓰는 것은 여기 있는 것뿐이다.
// 2026-09-14
export { compile, CompileError } from './compiler.js';
export { parse, ParseError } from './parser.js';
export { tokenize, LexError } from './lexer.js';
export {
  validateBackend, supportsFloat, instrument,
  INT_OPS, FLOAT_OPS, CORE_OPS, BackendError,
} from './backend.js';
export { memoize } from './memoize.js';
export { createPlainBackend } from '../backends/plain.js';
export { createFHE16Backend, inspectFHE16, FHE16BackendError } from '../backends/fhe16.js';

/**
 * 같은 프로그램을 두 백엔드에서 돌려 결과를 맞춰 본다.
 * 회로가 틀렸을 때 이게 먼저 잡는다.
 */
export async function differential(source, args, backendA, backendB, options = {}) {
  const { compile } = await import('./compiler.js');
  const { instrument } = await import('./backend.js');
  const sinkA = {}, sinkB = {};
  const progA = compile(source, options);
  const progB = compile(source, options);
  const outA = progA.run(instrument(backendA, sinkA), args, options);
  const outB = progB.run(instrument(backendB, sinkB), args, options);
  const a = String(outA.value), b = String(outB.value);
  return {
    match: a === b,
    a: { value: a, backend: backendA.name || 'A', counts: sinkA.counts, millis: sinkA.millis },
    b: { value: b, backend: backendB.name || 'B', counts: sinkB.counts, millis: sinkB.millis },
  };
}
