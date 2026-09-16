// 컴파일러 — AST를 백엔드 호출 시퀀스로 내린다.
//
// 암호문 위에서는 값을 볼 수 없다. 그래서 두 가지를 한다.
//   분기 평탄화 — 양쪽 가지를 다 계산한 뒤 select 로 합친다
//   루프 전개   — 반복 횟수가 상수일 때만 펼친다
// 2026-09-14
import { parse } from './parser.js';
import { validateBackend, supportsFloat } from './backend.js';

export class CompileError extends Error {
  constructor(message, line) {
    super(line ? `${line}행: ${message}` : message);
    this.line = line;
  }
}

const DEFAULT_TYPE = { bits: 32, signed: true, float: false };
const BOOL_TYPE = { bits: 1, signed: false, float: false };
const MAX_UNROLL = 4096;

const TYPE_NAMES = {
  i8:  { bits: 8,  signed: true,  float: false },
  i16: { bits: 16, signed: true,  float: false },
  i32: { bits: 32, signed: true,  float: false },
  i64: { bits: 64, signed: true,  float: false },
  u8:  { bits: 8,  signed: false, float: false },
  u16: { bits: 16, signed: false, float: false },
  u32: { bits: 32, signed: false, float: false },
  u64: { bits: 64, signed: false, float: false },
  bool: BOOL_TYPE,
  f64: { bits: 64, signed: true, float: true },
  float: { bits: 64, signed: true, float: true },
};

function typeOf(name, line) {
  if (!name) return null;
  const t = TYPE_NAMES[name];
  if (!t) throw new CompileError(`모르는 타입 ${name} — 쓸 수 있는 것 ${Object.keys(TYPE_NAMES).join(', ')}`, line);
  return t;
}

/** 두 타입을 합칠 때의 결과 타입. 넓은 쪽을 따른다. */
function unify(a, b) {
  if (a.float || b.float) return { bits: 64, signed: true, float: true };
  return {
    bits: Math.max(a.bits, b.bits),
    signed: a.signed || b.signed,
    float: false,
  };
}

const INT_BINOP = {
  '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'mod',
  '&': 'and', '|': 'or', '^': 'xor', '<<': 'shl', '>>': 'shr', '>>>': 'shr',
};
const CMP_BINOP = {
  '==': 'eq', '===': 'eq', '!=': 'ne', '!==': 'ne',
  '<': 'lt', '<=': 'le', '>': 'gt', '>=': 'ge',
};
const FLOAT_BINOP = { '+': 'fadd', '-': 'fsub', '*': 'fmul', '/': 'fdiv' };
const FLOAT_CMP = {
  '==': 'feq', '===': 'feq', '!=': 'fne', '!==': 'fne',
  '<': 'flt', '<=': 'fle', '>': 'fgt', '>=': 'fge',
};
const BUILTIN = {
  'Math.min': { int: 'min', float: 'fmin', arity: 2 },
  'Math.max': { int: 'max', float: 'fmax', arity: 2 },
  'Math.abs': { int: 'abs', float: 'fabs', arity: 1 },
  'Math.floor': { float: 'ffloor', arity: 1 },
  'Math.ceil':  { float: 'fceil', arity: 1 },
  'Math.round': { float: 'fround', arity: 1 },
  'Math.trunc': { float: 'ftrunc', arity: 1 },
  'min': { int: 'min', float: 'fmin', arity: 2 },
  'max': { int: 'max', float: 'fmax', arity: 2 },
  'abs': { int: 'abs', float: 'fabs', arity: 1 },
  'select': { arity: 3, special: 'select' },
};

class ReturnSignal {
  constructor(value) { this.value = value; }
}

export function compile(source, options = {}) {
  const program = parse(source);
  const entryName = options.entry || program.functions[0].name;
  const fn = program.functions.find(f => f.name === entryName);
  if (!fn) throw new CompileError(`${entryName} 함수를 찾지 못했다`);

  const paramTypes = fn.params.map(p => typeOf(p.type, p.line) || options.paramType || DEFAULT_TYPE);
  const usesFloat = paramTypes.some(t => t.float) || /\bf64\b|\bfloat\b|\d+\.\d/.test(source);

  return {
    name: fn.name,
    params: fn.params.map((p, i) => ({ name: p.name, visibility: p.visibility, type: paramTypes[i] })),
    usesFloat,
    source,

    /**
     * 백엔드 위에서 실행한다. 백엔드는 규약만 지키면 무엇이든 된다.
     * @param {object} backend
     * @param {Array} args 평문 입력값
     */
    run(backend, args, runOptions = {}) {
      validateBackend(backend, { requireFloat: usesFloat });
      if (usesFloat && !supportsFloat(backend)) {
        throw new CompileError(`백엔드 ${backend.name || ''}가 실수 연산을 제공하지 않는다`);
      }
      return execute(fn, paramTypes, backend, args, runOptions);
    },
  };
}

function execute(fn, paramTypes, backend, args, runOptions) {
  const maxUnroll = runOptions.maxUnroll || MAX_UNROLL;
  let unrolled = 0;
  // 상태 합류가 몇 번 일어났고 그중 몇 개를 싸게 만들었는지
  const merges = { total: 0, identical: 0, condKnown: 0, free: 0, cheap: 0, general: 0 };

  // 스코프 — 각 항목은 { handle, type } 또는 { plain: BigInt|Number, type }
  // 리터럴이 따를 폭. 파라미터가 i8 이면 리터럴도 i8 이라야 섞인다.
  const NAT = paramTypes.find(t => !t.float) || DEFAULT_TYPE;

  const scopes = [new Map()];
  const pushScope = () => scopes.push(new Map());
  const popScope = () => scopes.pop();
  const lookup = (name, line) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name)) return scopes[i].get(name);
    }
    throw new CompileError(`${name}을 찾지 못했다`, line);
  };
  const declare = (name, cell) => { scopes[scopes.length - 1].set(name, cell); };
  const assign = (name, cell, line) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name)) { scopes[i].set(name, cell); return; }
    }
    throw new CompileError(`${name}을 찾지 못했다`, line);
  };

  if (args.length !== fn.params.length) {
    throw new CompileError(`인자 ${fn.params.length}개가 필요한데 ${args.length}개를 받았다`);
  }
  fn.params.forEach((p, i) => {
    const type = paramTypes[i];
    if (p.visibility === 'public') {
      declare(p.name, { plain: type.float ? Number(args[i]) : BigInt(args[i]), type });
    } else {
      declare(p.name, { handle: backend.encrypt(type.float ? Number(args[i]) : BigInt(args[i]), type), type });
    }
  });

  // 평문 상수를 암호문 핸들로 올린다. 필요할 때만 부른다.
  const lift = (cell, type) => {
    const t = type || cell.type;
    if (cell.handle !== undefined) return cell.handle;
    return backend.constant(cell.plain, t);
  };
  const isPlain = cell => cell.handle === undefined;

  // 백엔드의 비교 결과가 정수 0/1 인가. 아니면(네이티브 비교 도메인) 조건은
  // select 의 조건 자리에만 들어갈 수 있고, 값으로 쓰려면 정수화해야 한다.
  const condIsInt = backend.conditionIsInteger !== false;
  const isCond = cell => !isPlain(cell) && (cell.type === BOOL_TYPE || (cell.type.bits === 1 && !cell.type.float));

  /**
   * 조건(비교 결과)을 값으로 쓸 때.
   *
   * 조건은 1비트 폭(BOOL_TYPE)으로 표시된다. 그대로 산술에 넣으면 결과도
   * 1비트로 접혀 (a<b)*5 가 1 이 된다. 값으로 쓸 때는 함수 기본 폭으로 넓힌다.
   *
   * 정수 도메인 백엔드는 조건이 이미 0/1 정수라 폭 표시만 바꾼다.
   * 네이티브 비교 도메인에서는 select(c, 1, 0) 으로 정수 0/1 을 만든다.
   */
  function asValue(cell, type) {
    if (!isCond(cell)) return cell;
    const t = type && !type.float ? type : NAT;
    if (condIsInt) return { handle: cell.handle, type: t };
    return { handle: backend.select(cell.handle, backend.constant(1n, t), backend.constant(0n, t), t), type: t };
  }

  /**
   * 결과 폭을 정한다.
   * 평문 리터럴은 폭이 없는 값으로 본다. 한쪽만 암호문이면 그쪽 폭을 따른다.
   * 이렇게 해야 i8 파라미터에 리터럴을 섞어도 폭이 어긋나지 않는다.
   */
  function resultType(L, R) {
    const lp = isPlain(L), rp = isPlain(R);
    if (lp && !rp) return R.type;
    if (rp && !lp) return L.type;
    return unify(L.type, R.type);
  }

  function binary(op, L, R, line) {
    // && || 는 조건을 조건으로 쓰므로 그대로 둔다. 나머지는 값으로 쓴다.
    if (op !== '&&' && op !== '||') { L = asValue(L); R = asValue(R); }
    const type = resultType(L, R);

    // 양쪽이 평문이면 회로를 만들지 않는다. 상수 접기.
    if (isPlain(L) && isPlain(R)) {
      const v = foldPlain(op, L.plain, R.plain, type, line);
      if (v !== undefined) return { plain: v, type: CMP_BINOP[op] ? BOOL_TYPE : type };
    }

    if (type.float) {
      if (FLOAT_BINOP[op]) return { handle: backend[FLOAT_BINOP[op]](lift(L, type), lift(R, type), type), type };
      if (FLOAT_CMP[op]) return { handle: backend[FLOAT_CMP[op]](lift(L, type), lift(R, type)), type: BOOL_TYPE };
      throw new CompileError(`실수에 ${op} 연산자를 쓸 수 없다`, line);
    }
    if (CMP_BINOP[op]) {
      // 결과는 조건값이다. BOOL 로 표시해 truthy 가 다시 비교하지 않게 한다.
      // 백엔드에는 피연산자 폭을 넘긴다.
      return { handle: backend[CMP_BINOP[op]](lift(L, type), lift(R, type), type), type: BOOL_TYPE };
    }
    if (INT_BINOP[op]) return { handle: backend[INT_BINOP[op]](lift(L, type), lift(R, type), type), type };

    // && || 는 합류로 내린다. 단락 평가는 암호문에서 불가능하다.
    //   a && b  =  φ(a, b, 0)      a || b  =  φ(a, 1, b)
    // 폭은 피연산자를 따른다. 1비트로 좁히면 넓은 암호문과 섞이지 않는다.
    if (op === '&&' || op === '||') {
      const lb = truthy(L), rb = truthy(R);
      const w = !isPlain(lb) ? lb.type : (!isPlain(rb) ? rb.type : BOOL_TYPE);
      return op === '&&'
        ? phi(lb, rb, { plain: 0n, type: w })
        : phi(lb, { plain: 1n, type: w }, rb);
    }
    if (op === '**') throw new CompileError('거듭제곱은 상수 지수만 지원한다 — a*a 로 풀어 쓴다', line);
    throw new CompileError(`모르는 연산자 ${op}`, line);
  }

  function foldPlain(op, a, b, type, line) {
    const num = type.float;
    const x = num ? Number(a) : BigInt(a), y = num ? Number(b) : BigInt(b);
    switch (op) {
      case '+': return x + y;
      case '-': return x - y;
      case '*': return x * y;
      case '/': return num ? (y === 0 ? 0 : x / y) : (y === 0n ? 0n : x / y);
      case '%': return num ? (y === 0 ? 0 : x % y) : (y === 0n ? 0n : x % y);
      case '<': return x < y ? 1n : 0n;
      case '<=': return x <= y ? 1n : 0n;
      case '>': return x > y ? 1n : 0n;
      case '>=': return x >= y ? 1n : 0n;
      case '==': case '===': return x === y ? 1n : 0n;
      case '!=': case '!==': return x !== y ? 1n : 0n;
      case '&&': return (x && y) ? 1n : 0n;
      case '||': return (x || y) ? 1n : 0n;
      default:
        if (num) return undefined;
        switch (op) {
          case '&': return x & y;
          case '|': return x | y;
          case '^': return x ^ y;
          case '<<': return x << y;
          case '>>': case '>>>': return x >> y;
          case '**': return x ** y;
          default: return undefined;
        }
    }
  }

  /** 값을 0/1 불리언으로 만든다. */
  function truthy(cell) {
    // 비교 결과는 이미 조건값이다. 다시 비교하면 도메인이 어긋난다.
    if (cell.type === BOOL_TYPE || (cell.type.bits === 1 && !cell.type.float)) return cell;
    if (isPlain(cell)) return { plain: (cell.type.float ? Number(cell.plain) !== 0 : BigInt(cell.plain) !== 0n) ? 1n : 0n, type: cell.type };
    const zero = backend.constant(cell.type.float ? 0 : 0n, cell.type);
    const op = cell.type.float ? 'fne' : 'ne';
    return { handle: backend[op](cell.handle, zero, cell.type), type: cell.type };
  }

  function evalExpr(node) {
    switch (node.kind) {
      case 'Literal': {
        const type = node.float ? { bits: 64, signed: true, float: true }
                   : node.bool ? BOOL_TYPE : NAT;
        return { plain: node.value, type };
      }
      case 'Identifier':
        return lookup(node.name, node.line);

      case 'Binary':
        return binary(node.operator, evalExpr(node.left), evalExpr(node.right), node.line);

      case 'Unary': {
        const v = node.operator === '!' ? evalExpr(node.argument) : asValue(evalExpr(node.argument));
        if (node.operator === '+') return v;
        if (node.operator === '-') {
          if (isPlain(v)) return { plain: v.type.float ? -Number(v.plain) : -BigInt(v.plain), type: v.type };
          return { handle: backend[v.type.float ? 'fneg' : 'neg'](v.handle, v.type), type: v.type };
        }
        if (node.operator === '!') {
          const b = truthy(v);
          if (isPlain(b)) return { plain: b.plain ? 0n : 1n, type: b.type };
          if (!condIsInt) {
            // 조건 도메인에는 뺄셈이 없다. select(c, 0, 1) 로 뒤집으면서 정수화한다.
            return { handle: backend.select(b.handle, backend.constant(0n, NAT), backend.constant(1n, NAT), NAT), type: NAT };
          }
          // 0/1 뒤집기는 1 − c. XOR 은 비트 단위가 아닐 수 있어 쓰지 않는다.
          const one = backend.constant(1n, b.type);
          return { handle: backend.sub(one, b.handle, b.type), type: b.type };
        }
        if (node.operator === '~') {
          if (v.type.float) throw new CompileError('실수에 ~ 를 쓸 수 없다', node.line);
          if (isPlain(v)) return { plain: ~BigInt(v.plain), type: v.type };
          return { handle: backend.not(v.handle, v.type), type: v.type };
        }
        throw new CompileError(`모르는 단항 연산자 ${node.operator}`, node.line);
      }

      case 'Conditional': {
        // 조건이 평문이면 한쪽만 계산한다. 암호문이면 양쪽 다 계산하고 합친다.
        const c = truthy(evalExpr(node.test));
        if (isPlain(c)) return c.plain ? evalExpr(node.consequent) : evalExpr(node.alternate);
        return phi(c, evalExpr(node.consequent), evalExpr(node.alternate));
      }

      case 'Assign': {
        const cur = lookup(node.name, node.line);
        let value;
        if (node.operator === '=') value = evalExpr(node.value);
        else {
          const op = node.operator.slice(0, -1);
          value = binary(op, cur, evalExpr(node.value), node.line);
        }
        const cell = coerce(value, cur.type);
        assign(node.name, cell, node.line);
        return cell;
      }

      case 'Update': {
        const cur = lookup(node.name, node.line);
        const one = { plain: cur.type.float ? 1 : 1n, type: cur.type };
        const next = coerce(binary(node.operator === '++' ? '+' : '-', cur, one, node.line), cur.type);
        assign(node.name, next, node.line);
        return node.prefix ? next : cur;
      }

      case 'Call': {
        const spec = BUILTIN[node.callee];
        if (!spec) throw new CompileError(`${node.callee} 는 회로로 내려갈 수 없다 — 쓸 수 있는 것 ${Object.keys(BUILTIN).join(', ')}`, node.line);
        if (node.args.length !== spec.arity) {
          throw new CompileError(`${node.callee} 는 인자 ${spec.arity}개를 받는다`, node.line);
        }
        let vals = node.args.map(evalExpr);
        if (spec.special === 'select') {
          return phi(truthy(vals[0]), vals[1], vals[2]);
        }
        vals = vals.map(v => asValue(v));
        const encrypted = vals.filter(v => !isPlain(v));
        const type = (encrypted.length ? encrypted : vals)
          .reduce((acc, v) => (acc ? unify(acc, v.type) : v.type), null);
        const opName = type.float ? spec.float : spec.int;
        if (!opName) throw new CompileError(`${node.callee} 는 ${type.float ? '실수' : '정수'}에 쓸 수 없다`, node.line);
        const handles = vals.map(v => lift(v, type));
        return { handle: backend[opName](...handles, type), type };
      }

      case 'Member':
        throw new CompileError(`${node.object}.${node.property} 는 값으로 쓸 수 없다`, node.line);

      default:
        throw new CompileError(`${node.kind} 는 회로로 내려가지 않는다`, node.line);
    }
  }

  /** 선언 타입에 맞춘다. */
  function coerce(cell, type) {
    if (!type || cell.type === type) return cell;
    if (cell.type.bits === type.bits && cell.type.float === type.float && cell.type.signed === type.signed) return cell;
    if (isPlain(cell)) return { plain: cell.plain, type };
    return { handle: cell.handle, type };
  }

  function execBlock(block) {
    if (block.transparent) {
      for (const stmt of block.body) execStatement(stmt);
      return;
    }
    pushScope();
    try {
      for (const stmt of block.body) execStatement(stmt);
    } finally {
      popScope();
    }
  }

  function execStatement(stmt) {
    switch (stmt.kind) {
      case 'VarDecl': {
        const type = typeOf(stmt.type, stmt.line);
        declare(stmt.name, coerce(evalExpr(stmt.init), type));
        return;
      }
      case 'Return':
        throw new ReturnSignal(stmt.argument ? evalExpr(stmt.argument) : { plain: 0n, type: DEFAULT_TYPE });

      case 'ExpressionStatement':
        evalExpr(stmt.expression);
        return;

      case 'Block':
        execBlock(stmt);
        return;

      case 'Empty':
        return;

      case 'If': {
        const c = truthy(evalExpr(stmt.test));
        if (isPlain(c)) {
          if (c.plain) execStatement(stmt.consequent);
          else if (stmt.alternate) execStatement(stmt.alternate);
          return;
        }
        // 암호문 조건 — 양쪽을 다 실행하고, 바뀐 변수마다 select 로 합친다.
        const before = snapshot();
        execStatement(stmt.consequent);
        const afterThen = snapshot();
        restore(before);
        if (stmt.alternate) execStatement(stmt.alternate);
        const afterElse = snapshot();
        restore(before);
        mergeBranches(c, afterThen, afterElse, stmt.line);
        return;
      }

      case 'For': {
        pushScope();
        try {
          const initVal = evalExpr(stmt.init);
          if (!isPlain(initVal)) {
            throw new CompileError('for 초기값이 암호문이다 — 반복 횟수는 공개 값이어야 한다', stmt.line);
          }
          declare(stmt.varName, initVal);
          let guard = 0;
          for (;;) {
            const t = truthy(evalExpr(stmt.test));
            if (!isPlain(t)) {
              throw new CompileError('for 조건이 암호문이다 — 종료 시점을 알 수 없다. 상한을 공개 값으로 두고 안쪽에서 select 를 쓴다', stmt.line);
            }
            if (!t.plain) break;
            if (++guard > maxUnroll || ++unrolled > maxUnroll) {
              throw new CompileError(`루프 전개가 ${maxUnroll}회를 넘었다`, stmt.line);
            }
            execStatement(stmt.body);
            evalExpr(stmt.update);
          }
        } finally {
          popScope();
        }
        return;
      }

      default:
        throw new CompileError(`${stmt.kind} 는 회로로 내려가지 않는다`, stmt.line);
    }
  }

  function snapshot() {
    return scopes.map(s => new Map(s));
  }
  function restore(snap) {
    for (let i = 0; i < scopes.length; i++) scopes[i] = new Map(snap[i]);
  }
  function mergeBranches(cond, thenScopes, elseScopes, line) {
    for (let i = 0; i < scopes.length; i++) {
      for (const [name, base] of scopes[i]) {
        const t = thenScopes[i]?.get(name) ?? base;
        const e = elseScopes[i]?.get(name) ?? base;
        if (t === e) continue;
        scopes[i].set(name, phi(cond, t, e));
      }
    }
  }

  /**
   * 상태 합류 — SSA 의 φ 노드.
   * 모양을 보고 가장 싼 회로를 고른다. 삼항연산자는 이 중 일반형 하나일 뿐이다.
   */
  function phi(cond, t, e) {
    // 가지의 값이 조건 암호문이면 값으로 쓸 수 있게 정수화한다.
    t = asValue(t); e = asValue(e);
    // 양쪽이 리터럴이면 함수 기본 폭을 쓴다.
    let type = resultType(t, e);
    if (isPlain(t) && isPlain(e) && !type.float && type.bits < NAT.bits) {
      type = NAT;
    }
    merges.total++;

    // 양쪽이 같으면 합류 자체가 없다.
    // 셀 객체는 달라도 같은 암호문 핸들이면 같은 값이다.
    if (t === e) { merges.identical++; return t; }
    if (isPlain(t) && isPlain(e) && String(t.plain) === String(e.plain)) {
      merges.identical++;
      return { plain: t.plain, type };
    }
    if (!isPlain(t) && !isPlain(e) && t.handle === e.handle) {
      merges.identical++;
      return { handle: t.handle, type };
    }

    // 조건이 평문이면 한쪽만 남는다
    if (isPlain(cond)) {
      merges.condKnown++;
      return coerce(cond.plain ? t : e, type);
    }

    const c = lift(cond, BOOL_TYPE);
    const zero = v => isPlain(v) && (type.float ? Number(v.plain) === 0 : BigInt(v.plain) === 0n);
    const one  = v => isPlain(v) && (type.float ? Number(v.plain) === 1 : BigInt(v.plain) === 1n);

    // 아래 지름길은 조건이 정수 0/1 일 때만 성립한다. 네이티브 비교 도메인에서는
    // c 를 값으로 쓸 수 없으므로 항상 select 로 내린다.
    if (!type.float && condIsInt) {
      // φ(c, 1, 0) = c
      if (one(t) && zero(e)) { merges.free++; return { handle: c, type: BOOL_TYPE }; }
      // φ(c, 0, 1) = 1 - c
      if (zero(t) && one(e)) {
        merges.cheap++;
        const oneH = backend.constant(1n, type);
        return { handle: backend.sub(oneH, c, type), type };
      }
      // φ(c, t, 0) = c * t
      if (zero(e)) {
        merges.cheap++;
        return { handle: backend.mul(c, lift(t, type), type), type };
      }
      // φ(c, 0, e) = (1-c) * e
      if (zero(t)) {
        merges.cheap++;
        const oneH = backend.constant(1n, type);
        const notC = backend.sub(oneH, c, type);
        return { handle: backend.mul(notC, lift(e, type), type), type };
      }
    }

    merges.general++;
    return { handle: backend.select(c, lift(t, type), lift(e, type), type), type };
  }

  let result;
  try {
    execBlock(fn.body);
    result = { plain: 0n, type: DEFAULT_TYPE };
  } catch (e) {
    if (e instanceof ReturnSignal) result = e.value;
    else throw e;
  }

  if (isPlain(result)) return { value: result.plain, type: result.type, encrypted: false, merges };
  result = asValue(result);   // 조건 암호문을 그대로 복호하면 정수가 아니다
  return { value: backend.decrypt(result.handle, result.type), type: result.type, encrypted: true, merges };
}
