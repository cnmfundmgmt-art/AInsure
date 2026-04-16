const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const bytes = Buffer.from(content, 'utf8');

// Get line starts
const lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Find the function start (line 765: export default function InsurancePage() {)
let funcStartIdx = -1;
for (let i = 0; i < lineStarts.length; i++) {
  const line = bytes.slice(lineStarts[i], lineStarts[i + 1] || bytes.length).toString('utf8').replace(/\r?\n$/, '');
  if (line.includes('export default function InsurancePage')) {
    funcStartIdx = i;
    break;
  }
}
console.log('InsurancePage function starts at line', funcStartIdx + 1);

// Now trace brace count from the function start
let braceCount = 0;
let lastLineWithOpenBrace = -1;

for (let lineIdx = funcStartIdx; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 123) { braceCount++; lastLineWithOpenBrace = lineIdx + 1; }
    else if (bytes[i] === 125) { braceCount--; }
  }
  
  // Report if anything interesting happens
  if (lineIdx >= funcStartIdx && lineIdx <= funcStartIdx + 160) {
    const line = bytes.slice(lineStart, lineEnd).toString('utf8').replace(/\r?\n$/, '');
    if (braceCount < 0 || (lineIdx === funcStartIdx + 157 - 1)) { // around line 922
      console.log('Line', lineIdx + 1, ': braceCount =', braceCount, '|', line.substring(0, 60));
    }
  }
  
  if (lineIdx > funcStartIdx + 160) break;
}

console.log('\nAt line', funcStartIdx + 158, 'braceCount =', braceCount);

// Find the first line where braceCount goes negative
braceCount = 0;
for (let lineIdx = funcStartIdx; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 123) braceCount++;
    else if (bytes[i] === 125) braceCount--;
  }
  
  if (braceCount < 0) {
    const line = bytes.slice(lineStart, lineEnd).toString('utf8').replace(/\r?\n$/, '');
    console.log('First negative brace at line', lineIdx + 1, ': braceCount =', braceCount, '|', line.substring(0, 60));
    break;
  }
}

// What is the brace count at line 923 (before processing line 923)
braceCount = 0;
for (let lineIdx = funcStartIdx; lineIdx < 922; lineIdx++) { // 0-indexed, line 923 = index 922
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 123) braceCount++;
    else if (bytes[i] === 125) braceCount--;
  }
}
console.log('\nBrace count BEFORE line 923:', braceCount);

// Now do the same for line 923
const line923Start = lineStarts[922];
const line923End = lineStarts[923];
for (let i = line923Start; i < line923End; i++) {
  if (bytes[i] === 123) braceCount++;
  else if (bytes[i] === 125) braceCount--;
}
console.log('Brace count AFTER line 923:', braceCount);

// And line 924 (empty)
if (lineStarts[924]) {
  const line924End = lineStarts[925];
  const line924Start = lineStarts[924];
  // No braces in empty line
  console.log('Line 924 is empty');
}

// Brace count at line 925 (const leftSidebar = ()
console.log('Brace count at line 925:', braceCount);

// Now the big question: is the function properly closed?
console.log('\n=== Looking for function closing brace ===');
braceCount = 0;
for (let lineIdx = funcStartIdx; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  for (let i = lineStart; i < lineEnd; i++) {
    if (bytes[i] === 123) braceCount++;
    else if (bytes[i] === 125) braceCount--;
  }
  
  if (lineIdx >= 1175 && lineIdx <= 1185) {
    const line = bytes.slice(lineStart, lineEnd).toString('utf8').replace(/\r?\n$/, '');
    console.log('Line', lineIdx + 1, ': braceCount =', braceCount, '|', line.substring(0, 60));
  }
}

console.log('\nFinal brace count:', braceCount);