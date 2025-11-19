const fs = require('fs');
const text = fs.readFileSync('chessrep-main/frontend/src/components/EnhancedChessStudyWithSimplifiedBoard.jsx', 'utf8');
const stack = [];
let state = 'code';
let quote = '';
let stringStart = -1;
let regexStart = -1;
let lastSig = '';
for (let i = 0; i < text.length; i++) {
  const ch = text[i];
  const next = text[i + 1];

  if (state === 'code') {
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (ch === '\n' || ch === '\r') {
        lastSig = '\n';
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      state = 'blockcomment';
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      state = 'linecomment';
      i++;
      continue;
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      state = 'string';
      quote = ch;
      stringStart = i;
      continue;
    }
    const maybeRegex = ch === '/';
    if (maybeRegex && next !== '>' && lastSig !== '<') {
      const allowedPrev = new Set(['', '(', '[', '{', ',', '=', ':', '?', '!', '&', '|', '^', '%', ';', '<', '>', '+', '-', '*', '/', '~', '\n']);
      if (allowedPrev.has(lastSig)) {
        state = 'regex';
        regexStart = i;
        continue;
      }
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push({ ch, pos: i });
      lastSig = ch;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      if (!stack.length) {
        console.log('Unmatched closing', ch, 'at', i);
        process.exit(0);
      }
      const last = stack.pop();
      if (
        (last.ch === '(' && ch !== ')') ||
        (last.ch === '[' && ch !== ']') ||
        (last.ch === '{' && ch !== '}')
      ) {
        console.log('Mismatched closing', ch, 'at', i, 'expected match for', last.ch, 'opened at', last.pos);
        process.exit(0);
      }
      lastSig = ch;
      continue;
    }
    lastSig = ch;
    continue;
  } else if (state === 'string') {
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === quote) {
      state = 'code';
      quote = '';
      stringStart = -1;
      lastSig = quote;
      continue;
    }
    if (ch === '\n' && quote !== '`') {
      const before = text.slice(0, stringStart);
      const line = before.split(/\n/).length;
      const column = stringStart - before.lastIndexOf('\n');
      console.log('Unterminated string starting at index', stringStart, 'line', line, 'column', column);
      process.exit(0);
    }
    continue;
  } else if (state === 'regex') {
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '[') {
      state = 'regexCharClass';
      continue;
    }
    if (ch === '/') {
      state = 'code';
      regexStart = -1;
      lastSig = '/';
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      const before = text.slice(0, regexStart);
      const line = before.split(/\n/).length;
      const column = regexStart - before.lastIndexOf('\n');
      console.log('Unterminated regex starting at index', regexStart, 'line', line, 'column', column);
      process.exit(0);
    }
    continue;
  } else if (state === 'regexCharClass') {
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === ']') {
      state = 'regex';
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      const before = text.slice(0, regexStart);
      const line = before.split(/\n/).length;
      const column = regexStart - before.lastIndexOf('\n');
      console.log('Unterminated regex char class starting at index', regexStart, 'line', line, 'column', column);
      process.exit(0);
    }
    continue;
  } else if (state === 'blockcomment') {
    if (ch === '*' && next === '/') {
      state = 'code';
      i++;
      continue;
    }
    continue;
  } else if (state === 'linecomment') {
    if (ch === '\n') {
      state = 'code';
      lastSig = '\n';
      continue;
    }
    continue;
  }
}
if (state === 'string') {
  const before = text.slice(0, stringStart);
  const line = before.split(/\n/).length;
  const column = stringStart - before.lastIndexOf('\n');
  console.log('Unterminated string at EOF, started at line', line, 'column', column);
} else if (state === 'regex' || state === 'regexCharClass') {
  const before = text.slice(0, regexStart);
  const line = before.split(/\n/).length;
  const column = regexStart - before.lastIndexOf('\n');
  console.log('Unterminated regex at EOF, started at line', line, 'column', column);
} else if (stack.length) {
  console.log('Unclosed delimiters remain:', stack.slice(-5));
} else {
  console.log('Delimiter balance appears ok');
}
