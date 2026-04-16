const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

console.log('=== Tracing from line 1 to 935 ===\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let lineIdx = 0; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  
  let changes = [];
  let changeStr = '';
  for (let i = 0; i < lineBytes.length; i++) {
    const b = lineBytes[i];
    if (b === 123) { braceCount++; changes.push('{'); changeStr += '{'; }
    else if (b === 125) { braceCount--; changes.push('}'); changeStr += '}'; }
    else if (b === 40) { parenCount++; changes.push('('); changeStr += '('; }
    else if (b === 41) { parenCount--; changes.push(')'); changeStr += ')'; }
    else if (b === 91) { bracketCount++; changes.push('['); changeStr += '['; }
    else if (b === 93) { bracketCount--; changes.push(']'); changeStr += ']'; }
  }
  
  const line = lineBytes.toString('utf8').replace(/\n$/, '');
  
  // Only show lines with bracket changes or interesting structure
  if (changes.length > 0) {
    console.log('Line ' + (lineIdx + 1) + ' (b=' + braceCount + ', p=' + parenCount + ', k=' + bracketCount + '): ' + changeStr);
    console.log('  | ' + line.substring(0, 70));
  }
  
  if (lineIdx >= 899 && lineIdx <= 930) {
    console.log('Line ' + (lineIdx + 1) + ' (b=' + braceCount + ', p=' + parenCount + ', k=' + bracketCount + '): ' + (changes.length > 0 ? changeStr : '(no changes)'));
    console.log('  | ' + line.substring(0, 70));
  }
  
  if (lineIdx > 935) break;
}

console.log('\n=== Key findings ===');
console.log('Brace count going negative means there are more } than { at some point');
console.log('This would happen if something is closed before it is opened');

// Specifically look at line 913 (the })); that closes a useEffect)
console.log('\n=== Lines 913-925 in detail ===');
for (let lineIdx = 912; lineIdx < 925; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  const line = lineBytes.toString('utf8').replace(/\n$/, '');
  
  let changes = [];
  let afterBrace = 0, afterParen = 0, afterBracket = 0;
  let b = 0, p = 0, k = 0;
  for (let i = 0; i < lineBytes.length; i++) {
    const c = lineBytes[i];
    if (c === 123) { b++; changes.push('{'); }
    else if (c === 125) { b--; changes.push('}'); }
    else if (c === 40) { p++; changes.push('('); }
    else if (c === 41) { p--; changes.push(')'); }
    else if (c === 91) { k++; changes.push('['); }
    else if (c === 93) { k--; changes.push(']'); }
  }
  afterBrace = b; afterParen = p; afterBracket = k;
  
  console.log('Line ' + (lineIdx + 1) + ': before={' + (braceCount - afterBrace) + '} after={' + braceCount + '} changes:[' + changes.join('') + '] | ' + line.substring(0, 60));
  
  // Update running count
  braceCount = b;
  parenCount = p;
  bracketCount = k;
}