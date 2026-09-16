// 대조 시험 — 컴파일 결과와 순수 자바스크립트 실행을 맞춰 본다.
import { compile } from '../src/compiler.js';
import { createPlainBackend } from '../backends/plain.js';
import { instrument } from '../src/backend.js';

const CASES = [
  { name: '산술',        src: 'function f(a,b){ return a*b + a - 7; }',                 ref: (a,b)=>a*b+a-7 },
  { name: '비교·삼항',    src: 'function f(a,b){ return a > b ? a - b : b - a; }',       ref: (a,b)=>a>b?a-b:b-a },
  { name: '암호문 분기',  src: 'function f(a,b){ let s = a; if (a > b) { s = a*2; } else { s = b*3; } return s; }', ref:(a,b)=>a>b?a*2:b*3 },
  { name: '중첩 분기',    src: 'function f(a,b){ let s=0; if(a>0){ if(b>0){s=1;} else {s=2;} } else {s=3;} return s; }', ref:(a,b)=>a>0?(b>0?1:2):3 },
  { name: '루프 누적',    src: 'function f(a,b){ let s=0; for(let i=0;i<5;i++){ s += a*i - b; } return s; }', ref:(a,b)=>{let s=0;for(let i=0;i<5;i++)s+=a*i-b;return s;} },
  { name: '루프 속 분기', src: 'function f(a,b){ let s=0; for(let i=0;i<4;i++){ if(a>i){ s+=a; } else { s-=b; } } return s; }', ref:(a,b)=>{let s=0;for(let i=0;i<4;i++){if(a>i)s+=a;else s-=b;}return s;} },
  { name: '논리 연산',    src: 'function f(a,b){ return (a>0 && b>0) ? 1 : ((a>0 || b>0) ? 2 : 3); }', ref:(a,b)=>(a>0&&b>0)?1:((a>0||b>0)?2:3) },
  { name: '내장 함수',    src: 'function f(a,b){ return max(a,b) - min(a,b) + abs(a-b); }', ref:(a,b)=>Math.max(a,b)-Math.min(a,b)+Math.abs(a-b) },
  { name: '비트 연산',    src: 'function f(a,b){ return ((a & 15) | (b << 2)) ^ 5; }',   ref:(a,b)=>((a&15)|(b<<2))^5 },
  { name: '공개 파라미터', src: 'function f(secret a, public k){ let s=0; for(let i=0;i<k;i++){ s+=a; } return s; }', ref:(a,k)=>{let s=0;for(let i=0;i<k;i++)s+=a;return s;} },
  { name: '단항',        src: 'function f(a,b){ return -a + (!(a>b) ? 10 : 20) + (~b); }', ref:(a,b)=>-a+((!(a>b))?10:20)+(~b) },
  { name: '증감',        src: 'function f(a,b){ let x=a; x++; ++x; x+=b; return x; }',  ref:(a,b)=>{let x=a;x++;++x;x+=b;return x;} },
  // 비교 결과를 값으로 쓴다 — 1비트로 접히면 안 된다.
  { name: '비교값 산술',  src: 'function f(a,b){ return (a < b) * 5 + (a == b); }',     ref:(a,b)=>(a<b?1:0)*5+(a===b?1:0) },
  { name: '조건 합',      src: 'function f(a,b){ const s = a == b ? 1 : 0; const n = abs(a-b) < 3 ? 1 : 0; return s + n; }', ref:(a,b)=>(a===b?1:0)+(Math.abs(a-b)<3?1:0) },
];

function randInt() { return BigInt(Math.floor(Math.random()*41) - 20); }

let pass = 0, fail = 0;
const ROUNDS = 24;
for (const c of CASES) {
  let ok = true, firstBad = null;
  const sink = {};
  for (let r = 0; r < ROUNDS; r++) {
    const a = randInt();
    const b = c.name === '공개 파라미터' ? BigInt(Math.floor(Math.random()*6)) : randInt();
    let expected;
    try { expected = BigInt(c.ref(Number(a), Number(b))); } catch { continue; }
    const prog = compile(c.src);
    const out = prog.run(instrument(createPlainBackend(), sink), [a, b]);
    if (BigInt(out.value) !== expected) {
      ok = false;
      firstBad = { a: String(a), b: String(b), got: String(out.value), want: String(expected) };
      break;
    }
  }
  const ops = Object.entries(sink.counts || {}).filter(([k]) => !['encrypt','decrypt','constant'].includes(k))
    .reduce((s, [,v]) => s + v, 0);
  if (ok) { pass++; console.log(`  통과  ${c.name.padEnd(12)} 연산 ${Math.round(ops/ROUNDS)}회/실행`); }
  else { fail++; console.log(`  실패  ${c.name.padEnd(12)} a=${firstBad.a} b=${firstBad.b} → ${firstBad.got} (기대 ${firstBad.want})`); }
}

const REJECT = [
  { name: '암호문 루프',   src: 'function f(a,b){ let s=0; for(let i=0;i<a;i++){ s+=1; } return s; }' },
  { name: '배열',          src: 'function f(a,b){ const x=[1,2]; return x[0]; }' },
  { name: '문자열',        src: 'function f(a,b){ return "x"; }' },
  { name: '모르는 호출',    src: 'function f(a,b){ return foo(a); }' },
];
console.log('\n거절 확인');
for (const r of REJECT) {
  try {
    compile(r.src).run(createPlainBackend(), [3n, 4n]);
    console.log(`  실패  ${r.name} — 거절했어야 한다`); fail++;
  } catch (e) {
    console.log(`  통과  ${r.name.padEnd(12)} ${String(e.message).slice(0, 60)}`); pass++;
  }
}
console.log(`\n통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
