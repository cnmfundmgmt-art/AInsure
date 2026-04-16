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

console.log('Tracing all bracket changes from line 900 onwards...\n');

for (let lineIdx = 899; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  
  let changes = [];
  for (let i = 0; i < lineBytes.length; i++) {
    const b = lineBytes[i];
    if (b === 123) { braceCount++; changes.push('{'); }
    else if (b === 125) { braceCount--; changes.push('}'); }
    else if (b === 40) { parenCount++; changes.push('('); }
    else if (b === 41) { parenCount--; changes.push(')'); }
    else if (b === 91) { bracketCount++; changes.push('['); }
    else if (b === 93) { bracketCount--; changes.push(']'); }
  }
  
  const line = lineBytes.toString('utf8').replace(/\n$/, '');
  if (changes.length > 0 || (lineIdx >= 917 && lineIdx <= 930)) {
    console.log('Line ' + (lineIdx + 1) + ': b=' + braceCount + ', p=' + parenCount + ', k=' + bracketCount + 
                 (changes.length > 0 ? ' changes:[' + changes.join('') + ']' : '') + 
                 ' | ' + line.substring(0, 70));
  }
  
  if (lineIdx > 935) break;
}

console.log('\nAt line 925 (start), before processing line 925: brace=' + braceCount + ', paren=' + parenCount);

// Now specifically look at what opens a paren before line 925 that hasn't been closed
// parenCount at line 925 start should be 0 if things are balanced

// Find what paren is still open
console.log('\n=== Looking for unclosed parens before line 925 ===');
let parenOpenAt = [];
for (let lineIdx = 0; lineIdx < 925; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 40) parenOpenAt.push({ byte: i, line: lineIdx + 1 });
    if (bytes[i] === 41) { parenOpenAt.pop(); }
  }
}

console.log('Unclosed parens: ' + JSON.stringify(parenOpenAt, null, 2));
console.log('Count: ' + parenOpenAt.length);

// For debugging, let me look at what parens exist in lines 917-925
console.log('\n=== All parens in lines 917-925 ===');
for (let lineIdx = 916; lineIdx < 925; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const line = bytes.slice(lineStart, lineEnd).toString('utf8').replace(/\n$/, '');
  
  for (let i = 0; i < line.length; i++) {
    const b = line[i];
    if (b === '(' || b === ')') {
      console.log('Line ' + (lineIdx + 1) + ', pos ' + i + ': ' + b + 
                   ' (absolute byte ' + (lineStart + i) + ')');
    }
  }
}