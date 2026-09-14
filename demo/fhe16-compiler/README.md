# fhe16-compiler

자바스크립트 부분집합을 완전동형암호 회로로 내리는 컴파일러. 브라우저에서 돈다.

## 무엇을 하는가

```js
function riskScore(secret amount, secret history, public threshold) {
  let score = amount / 100 + history * 3;
  if (score > threshold) { score = score * 2; }
  return score > 500 ? 1 : 0;
}
```

이 함수가 암호문 위에서 그대로 실행된다. 입력은 암호화된 채 들어가고, 나오는 것은 판정값 하나다.

## 무엇을 못 하는가

암호문 위에서는 값을 볼 수 없다. 세 가지가 원천적으로 막힌다.

| 막히는 것 | 이유 | 우회 |
|---|---|---|
| 암호문 조건 분기 | 어느 가지로 갈지 모른다 | 양쪽을 다 계산하고 `select` 로 합친다 (컴파일러가 자동) |
| 암호문 조건 반복 | 종료 시점을 모른다 | 상한을 공개 값으로 두고 안쪽에서 `select` |
| 암호문 인덱싱 | 어느 칸인지 모른다 | 아직 지원하지 않는다 |

문자열, 객체, 클로저, 예외는 회로로 내려가지 않는다. 컴파일 시점에 거절한다.

## 지원 문법

- `function f(secret a, public k) { ... }` — 파라미터 앞에 `secret`(기본) 또는 `public`
- 타입 표기 `a: i32` — `i8 i16 i32 i64 u8 u16 u32 u64 bool f64`. 생략하면 `i32`
- `const` `let` `return` `if/else` `for`(상수 횟수)
- 산술 `+ - * / %`, 비교 `< <= > >= == !=`, 비트 `& | ^ ~ << >>`, 논리 `&& || !`
- 삼항 `? :`, 증감 `++ --`, 복합대입 `+= -= *= ...`
- 내장 `min max abs select` · `Math.min Math.max Math.abs Math.floor Math.ceil Math.round Math.trunc`

## 백엔드 규약

컴파일러는 FHE16을 직접 부르지 않는다. `src/backend.js` 에 적힌 이름만 부른다.

```js
encrypt(value, type)  decrypt(handle, type)  constant(value, type)
add sub mul div mod neg abs
eq ne lt le gt ge min max
and or xor not shl shr
select(cond, a, b, type)
```

엔진이 바뀌면 이 규약을 채우는 어댑터 하나만 새로 쓴다. 컴파일러는 손대지 않는다.

- `backends/plain.js` — 평문 참조 구현. 회로 대조용
- `backends/fhe16.js` — FHE16 WASM 어댑터

어댑터에 없는 연산은 대체 경로로 만든다. `select` 가 없으면 `b + cond*(a-b)` 로, `not` 이 없으면 전체 1과 XOR 로 내린다.

## 쓰는 법

```js
import { compile, createPlainBackend, createFHE16Backend } from './src/index.js';

const prog = compile(source);
const out = prog.run(createFHE16Backend(module), [12345n, 7n, 100n]);
console.log(out.value);
```

두 백엔드를 맞춰 보려면

```js
import { differential } from './src/index.js';
const r = await differential(source, args, createPlainBackend(), createFHE16Backend(module));
console.log(r.match ? '일치' : `어긋남 ${r.a.value} 대 ${r.b.value}`);
```

## 시험

```
node test/run.mjs
```

무작위 입력으로 컴파일 결과와 순수 자바스크립트 실행을 맞춘다. 거절해야 할 프로그램도 함께 본다.
