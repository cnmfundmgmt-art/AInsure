const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

console.log('Looking for the FIRST time parenCount goes to -1 (extra closing parens):\n');

let firstNegParen = null;
let firstNegBrace = null;

for (let lineIdx = 0; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  const line = lineBytes.toString('utf8').replace(/\n$/, '');
  
  let bBefore = braceCount;
  let pBefore = parenCount;
  let kBefore = bracketCount;
  
  for (let i = 0; i < lineBytes.length; i++) {
    const c = lineBytes[i];
    if (c === 123) { braceCount++; }
    else if (c === 125) { braceCount--; }
    else if (c === 40) { parenCount++; }
    else if (c === 41) { parenCount--; }
    else if (c === 91) { bracketCount++; }
    else if (c === 93) { bracketCount--; }
  }
  
  if (firstNegParen === null && parenCount < 0) {
    firstNegParen = { line: lineIdx + 1, pBefore, pAfter: parenCount, bBefore, bAfter: braceCount, lineContent: line };
    console.log('*** FIRST NEGATIVE PAREN at line ' + (lineIdx + 1) + ' ***');
    console.log('  Before: p=' + pBefore + ', After: p=' + parenCount);
    console.log('  Line: ' + line.substring(0, 80));
    console.log('  Running brace: ' + braceCount);
    console.log('');
  }
  
  if (firstNegBrace === null && braceCount < 0) {
    firstNegBrace = { line: lineIdx + 1, bBefore, bAfter: braceCount, lineContent: line };
    console.log('*** FIRST NEGATIVE BRACE at line ' + (lineIdx + 1) + ' ***');
    console.log('  Before: b=' + bBefore + ', After: b=' + braceCount);
    console.log('  Line: ' + line.substring(0, 80));
    console.log('');
  }
  
  if (lineIdx > 935) break;
}

console.log('\n=== Summary ===');
console.log('First negative paren: ' + (firstNegParen ? 'line ' + firstNegParen.line : 'none'));
console.log('First negative brace: ' + (firstNegBrace ? 'line ' + firstNegBrace.line : 'none'));

// Now let's see what the paren/brace state is at line 924 (before line 925)
console.log('\n=== State at line 924-925 boundary ===');
// Reset
braceCount = 0;
parenCount = 0;
bracketCount = 0;

for (let lineIdx = 0; lineIdx < 924; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  
  for (let i = 0; i < lineBytes.length; i++) {
    const c = lineBytes[i];
    if (c === 123) { braceCount++; }
    else if (c === 125) { braceCount--; }
    else if (c === 40) { parenCount++; }
    else if (c === 41) { parenCount--; }
    else if (c === 91) { bracketCount++; }
    else if (c === 93) { bracketCount--; }
  }
}

console.log('After processing line 924, before line 925:');
console.log('  brace=' + braceCount + ', paren=' + parenCount + ', bracket=' + bracketCount);
console.log('This means we have ' + parenCount + ' unclosed ( and ' + braceCount + ' unclosed { before line 925');

// Find what opened these unclosed parens/braces
console.log('\n=== Finding the unclosed opens ===');
let openParens = [];
let openBraces = [];

for (let lineIdx = 0; lineIdx < 925; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 40) openParens.push({ byte: i, line: lineIdx + 1 });
    if (bytes[i] === 41) openParens.pop();
    if (bytes[i] === 123) openBraces.push({ byte: i, line: lineIdx + 1 });
    if (bytes[i] === 125) openBraces.pop();
  }
}

console.log('Unclosed (' + JSON.stringify(openParens, null, 2));
console.log('Unclosed {' + JSON.stringify(openBraces, null, 2));
console.log('Count: parens=' + openParens.length + ', braces=' + openBraces.length);

// Look at context around the first unclosed paren
if (openParens.length > 0) {
  const firstOpen = openParens[0];
  const ctxStart = Math.max(0, firstOpen.byte - 30);
  const ctxEnd = Math.min(bytes.length, firstOpen.byte + 80);
  console.log('\nContext around first unclosed paren (byte ' + firstOpen.byte + ', line ' + firstOpen.line + '):');
  console.log(bytes.slice(ctxStart, ctxEnd).toString('utf8'));
}