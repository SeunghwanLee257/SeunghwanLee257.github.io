// 파서 — 지원 부분집합의 AST를 만든다.
// 회로로 내려갈 수 없는 문법은 여기서 막는다. 2026-09-14
import { tokenize } from './lexer.js';

export class ParseError extends Error {
  constructor(message, tok) {
    super(tok ? `${tok.line}:${tok.col} ${message}` : message);
    this.token = tok;
  }
}

// 우선순위가 클수록 먼저 묶인다.
const BINARY = {
  '||': 1, '&&': 2,
  '|': 3, '^': 4, '&': 5,
  '==': 6, '!=': 6, '===': 6, '!==': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7,
  '<<': 8, '>>': 8, '>>>': 8,
  '+': 9, '-': 9,
  '*': 10, '/': 10, '%': 10,
  '**': 11,
};
const RIGHT_ASSOC = new Set(['**']);
const UNARY = new Set(['-', '+', '!', '~']);
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=']);

export function parse(source) {
  const toks = tokenize(source);
  let p = 0;

  const peek = (k = 0) => toks[p + k];
  const at = (type, value) => {
    const t = toks[p];
    return t.type === type && (value === undefined || t.value === value);
  };
  const next = () => toks[p++];
  const eat = (type, value) => {
    if (!at(type, value)) return null;
    return next();
  };
  const expect = (type, value) => {
    if (!at(type, value)) {
      const t = toks[p];
      const got = t.type === 'eof' ? '입력 끝' : JSON.stringify(t.value?.raw ?? t.value);
      throw new ParseError(`${JSON.stringify(value ?? type)} 자리에 ${got}`, t);
    }
    return next();
  };

  function parseProgram() {
    const fns = [];
    while (!at('eof')) fns.push(parseFunction());
    if (fns.length === 0) throw new ParseError('function 선언이 필요하다', toks[0]);
    return { kind: 'Program', functions: fns };
  }

  function parseFunction() {
    const start = expect('keyword', 'function');
    const name = expect('name').value;
    expect('punct', '(');
    const params = [];
    if (!at('punct', ')')) {
      do {
        // secret a / public b / a  — 기본은 secret
        let visibility = 'secret';
        if (at('keyword', 'secret') || at('keyword', 'public')) visibility = next().value;
        const pname = expect('name').value;
        let type = null;
        if (eat('punct', ':')) type = expect('name').value;
        params.push({ name: pname, visibility, type, line: start.line });
      } while (eat('punct', ','));
    }
    expect('punct', ')');
    const body = parseBlock();
    return { kind: 'Function', name, params, body, line: start.line };
  }

  function parseBlock() {
    expect('punct', '{');
    const body = [];
    while (!at('punct', '}')) {
      if (at('eof')) throw new ParseError('닫히지 않은 블록', toks[p]);
      body.push(parseStatement());
    }
    expect('punct', '}');
    return { kind: 'Block', body };
  }

  function parseStatement() {
    const t = peek();

    if (t.type === 'keyword' && (t.value === 'const' || t.value === 'let')) {
      next();
      const decls = [];
      do {
        const name = expect('name').value;
        let type = null;
        if (eat('punct', ':')) type = expect('name').value;
        expect('punct', '=');
        decls.push({ name, type, init: parseExpression() });
      } while (eat('punct', ','));
      eat('punct', ';');
      if (decls.length === 1) {
        return { kind: 'VarDecl', declKind: t.value, ...decls[0], line: t.line };
      }
      return {
        kind: 'Block',
        body: decls.map(d => ({ kind: 'VarDecl', declKind: t.value, ...d, line: t.line })),
        transparent: true,
      };
    }

    if (t.type === 'keyword' && t.value === 'return') {
      next();
      const argument = at('punct', ';') || at('punct', '}') ? null : parseExpression();
      eat('punct', ';');
      return { kind: 'Return', argument, line: t.line };
    }

    if (t.type === 'keyword' && t.value === 'if') {
      next();
      expect('punct', '(');
      const test = parseExpression();
      expect('punct', ')');
      const consequent = at('punct', '{') ? parseBlock() : parseStatement();
      let alternate = null;
      if (eat('keyword', 'else')) {
        alternate = at('keyword', 'if') ? parseStatement()
                  : at('punct', '{') ? parseBlock()
                  : parseStatement();
      }
      return { kind: 'If', test, consequent, alternate, line: t.line };
    }

    if (t.type === 'keyword' && t.value === 'for') {
      next();
      expect('punct', '(');
      // for (let i = A; i < B; i++) — 경계는 전부 상수여야 한다
      const initTok = peek();
      if (!(initTok.type === 'keyword' && (initTok.value === 'let' || initTok.value === 'const'))) {
        throw new ParseError('for 초기식은 let 또는 const 선언이어야 한다', initTok);
      }
      next();
      const varName = expect('name').value;
      expect('punct', '=');
      const init = parseExpression();
      expect('punct', ';');
      const test = parseExpression();
      expect('punct', ';');
      const update = parseExpression();
      expect('punct', ')');
      const body = at('punct', '{') ? parseBlock() : parseStatement();
      return { kind: 'For', varName, init, test, update, body, line: t.line };
    }

    if (at('punct', '{')) return parseBlock();

    if (at('punct', ';')) { next(); return { kind: 'Empty' }; }

    const expr = parseExpression();
    eat('punct', ';');
    return { kind: 'ExpressionStatement', expression: expr, line: t.line };
  }

  function parseExpression() { return parseAssignment(); }

  function parseAssignment() {
    const left = parseTernary();
    const t = peek();
    if (t.type === 'punct' && ASSIGN_OPS.has(t.value)) {
      next();
      if (left.kind !== 'Identifier') {
        throw new ParseError('대입 왼쪽은 변수 이름이어야 한다', t);
      }
      const right = parseAssignment();
      return { kind: 'Assign', operator: t.value, name: left.name, value: right, line: t.line };
    }
    return left;
  }

  function parseTernary() {
    const test = parseBinary(0);
    if (eat('punct', '?')) {
      const consequent = parseAssignment();
      expect('punct', ':');
      const alternate = parseAssignment();
      return { kind: 'Conditional', test, consequent, alternate };
    }
    return test;
  }

  function parseBinary(minPrec) {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (t.type !== 'punct') break;
      const prec = BINARY[t.value];
      if (prec === undefined || prec < minPrec) break;
      next();
      const nextMin = RIGHT_ASSOC.has(t.value) ? prec : prec + 1;
      const right = parseBinary(nextMin);
      left = { kind: 'Binary', operator: t.value, left, right, line: t.line };
    }
    return left;
  }

  function parseUnary() {
    const t = peek();
    if (t.type === 'punct' && UNARY.has(t.value)) {
      next();
      return { kind: 'Unary', operator: t.value, argument: parseUnary(), line: t.line };
    }
    if (t.type === 'punct' && (t.value === '++' || t.value === '--')) {
      next();
      const arg = parseUnary();
      if (arg.kind !== 'Identifier') throw new ParseError('증감은 변수에만 쓴다', t);
      return { kind: 'Update', operator: t.value, name: arg.name, prefix: true, line: t.line };
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      const t = peek();
      if (t.type === 'punct' && (t.value === '++' || t.value === '--')) {
        next();
        if (node.kind !== 'Identifier') throw new ParseError('증감은 변수에만 쓴다', t);
        node = { kind: 'Update', operator: t.value, name: node.name, prefix: false, line: t.line };
        continue;
      }
      if (t.type === 'punct' && t.value === '(') {
        if (node.kind !== 'Identifier' && node.kind !== 'Member') {
          throw new ParseError('호출 대상이 이름이 아니다', t);
        }
        next();
        const args = [];
        if (!at('punct', ')')) {
          do { args.push(parseAssignment()); } while (eat('punct', ','));
        }
        expect('punct', ')');
        const callee = node.kind === 'Member' ? `${node.object}.${node.property}` : node.name;
        node = { kind: 'Call', callee, args, line: t.line };
        continue;
      }
      if (t.type === 'punct' && t.value === '.') {
        next();
        const prop = expect('name').value;
        if (node.kind !== 'Identifier') throw new ParseError('점 접근은 Math 같은 이름에만 쓴다', t);
        node = { kind: 'Member', object: node.name, property: prop, line: t.line };
        continue;
      }
      if (t.type === 'punct' && t.value === '[') {
        throw new ParseError('배열 인덱싱은 아직 회로로 내려가지 않는다', t);
      }
      break;
    }
    return node;
  }

  function parsePrimary() {
    const t = peek();

    if (t.type === 'number') {
      next();
      return { kind: 'Literal', value: t.value.value, float: t.value.float, raw: t.value.raw, line: t.line };
    }
    if (t.type === 'keyword' && (t.value === 'true' || t.value === 'false')) {
      next();
      return { kind: 'Literal', value: t.value === 'true' ? 1n : 0n, float: false, bool: true, raw: t.value, line: t.line };
    }
    if (t.type === 'name') {
      next();
      return { kind: 'Identifier', name: t.value, line: t.line };
    }
    if (t.type === 'punct' && t.value === '(') {
      next();
      const e = parseExpression();
      expect('punct', ')');
      return e;
    }
    if (t.type === 'punct' && t.value === '[') {
      throw new ParseError('배열 리터럴은 아직 회로로 내려가지 않는다', t);
    }
    if (t.type === 'punct' && t.value === '{') {
      throw new ParseError('객체 리터럴은 회로로 내려가지 않는다', t);
    }
    throw new ParseError(`식이 필요하다`, t);
  }

  const program = parseProgram();
  return program;
}
