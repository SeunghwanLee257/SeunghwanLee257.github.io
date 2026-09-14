// 토크나이저 — 지원 부분집합만 인식한다.
// 2026-09-14

const KEYWORDS = new Set([
  'function', 'return', 'const', 'let', 'if', 'else', 'for',
  'true', 'false', 'secret', 'public',
]);

const PUNCT = [
  '>>>=', '===', '!==', '>>>', '**=', '<<=', '>>=',
  '==', '!=', '<=', '>=', '&&', '||', '**', '<<', '>>',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '++', '--',
  '(', ')', '{', '}', '[', ']', ',', ';', ':', '?',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '.',
];

export class LexError extends Error {
  constructor(message, line, col) {
    super(`${line}:${col} ${message}`);
    this.line = line;
    this.col = col;
  }
}

export function tokenize(source) {
  const tokens = [];
  let i = 0, line = 1, col = 1;
  const n = source.length;

  const push = (type, value, startLine, startCol) => {
    tokens.push({ type, value, line: startLine, col: startCol });
  };

  while (i < n) {
    const ch = source[i];

    if (ch === '\n') { i++; line++; col = 1; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; col++; continue; }

    if (ch === '/' && source[i + 1] === '/') {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const sl = line, sc = col;
      i += 2; col += 2;
      let closed = false;
      while (i < n) {
        if (source[i] === '*' && source[i + 1] === '/') { i += 2; col += 2; closed = true; break; }
        if (source[i] === '\n') { line++; col = 1; } else col++;
        i++;
      }
      if (!closed) throw new LexError('닫히지 않은 주석', sl, sc);
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      const sl = line, sc = col;
      let j = i;
      if (ch === '0' && (source[i + 1] === 'x' || source[i + 1] === 'X')) {
        j = i + 2;
        while (j < n && /[0-9a-fA-F_]/.test(source[j])) j++;
        const raw = source.slice(i, j).replace(/_/g, '');
        push('number', { value: BigInt(raw), float: false, raw }, sl, sc);
      } else {
        while (j < n && /[0-9_]/.test(source[j])) j++;
        let isFloat = false;
        if (source[j] === '.' && /[0-9]/.test(source[j + 1] || '')) {
          isFloat = true; j++;
          while (j < n && /[0-9_]/.test(source[j])) j++;
        }
        if (source[j] === 'e' || source[j] === 'E') {
          const k = j + 1;
          const sign = (source[k] === '+' || source[k] === '-') ? 1 : 0;
          if (/[0-9]/.test(source[k + sign] || '')) {
            isFloat = true; j = k + sign;
            while (j < n && /[0-9]/.test(source[j])) j++;
          }
        }
        const raw = source.slice(i, j).replace(/_/g, '');
        push('number', isFloat
          ? { value: Number(raw), float: true, raw }
          : { value: BigInt(raw), float: false, raw }, sl, sc);
      }
      col += j - i;
      i = j;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const sl = line, sc = col;
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(source[j])) j++;
      const word = source.slice(i, j);
      push(KEYWORDS.has(word) ? 'keyword' : 'name', word, sl, sc);
      col += j - i;
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      throw new LexError('문자열은 회로로 내려가지 않는다', line, col);
    }

    const hit = PUNCT.find(p => source.startsWith(p, i));
    if (hit) {
      push('punct', hit, line, col);
      i += hit.length;
      col += hit.length;
      continue;
    }

    throw new LexError(`알 수 없는 문자 ${JSON.stringify(ch)}`, line, col);
  }

  push('eof', null, line, col);
  return tokens;
}
