const fs = require('fs');
const path = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

// Find line 919 start (useEffect)
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Line 918 is index 917 (0-indexed), line 919 is 918
console.log('Line 918 starts at byte:', lineStarts[917]);
console.log('Line 919 starts at byte:', lineStarts[918]);

const start918 = lineStarts[917];
const end921 = lineStarts[921] - 1; // include the \n

console.log('\nBytes 918-923:');
for (let i = start918; i < lineStarts[923]; i++) {
  const b = bytes[i];
  let display = b >= 32 && b < 127 ? String.fromCharCode(b) : '?';
  if (b === 13) display = '\\r';
  if (b === 10) display = '\\n';
  console.log(`${i}: ${b.toString().padStart(3)} = '${display}'`);
}

// Now let's look at the actual problem
// The issue is that SWC sees the < at line 925 as unexpected
// This suggests that the ( at line 925 is being matched to something before line 925
// Let me trace the ( balance

console.log('\n=== Tracing ( balance before line 925 ===');
let parenDepth = 0;
for (let i = 0; i < lineStarts[925]; i++) {
  if (bytes[i] === 40) { parenDepth++; console.log(`${i}: ( -> depth ${parenDepth}`); }
  else if (bytes[i] === 41) { parenDepth--; console.log(`${i}: ) -> depth ${parenDepth}`); }
}

console.log('At line 925 start, parenDepth =', parenDepth);

// If parenDepth > 0, then the ) on line 923 is matching something earlier
// and the ( on line 925 starts a new expression that's still inside something

// Let's look for any unusual character before line 925
console.log('\n=== Checking for unusual characters ===');
for (let i = 0; i < lineStarts[925]; i++) {
  const b = bytes[i];
  if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
    console.log(`Byte ${i}: ${b} (non-printable)`);
  }
}

// Maybe the issue is with JSX fragment or something like that
// Let me look at what happens with angle brackets
console.log('\n=== Tracing < > balance ===');
let angleDepth = 0;
for (let i = 0; i < lineStarts[925]; i++) {
  if (bytes[i] === 60) { angleDepth++; console.log(`${i}: < -> depth ${angleDepth}`); }
  else if (bytes[i] === 62) { angleDepth--; console.log(`${i}: > -> depth ${angleDepth}`); }
}
console.log('At line 925 start, angleDepth =', angleDepth);

// This is the key: if angleDepth != 0 before line 925, there's an unclosed <
// which would cause the parser to interpret <div as continuing an open tag
console.log('\nExpected: angleDepth should be 0');
console.log('Actual: angleDepth =', angleDepth);

// Let's find which < is not closed
if (angleDepth > 0) {
  console.log('\n=== Finding unclosed < ===');
  let checkDepth = 0;
  for (let i = 0; i < lineStarts[925]; i++) {
    if (bytes[i] === 60) {
      checkDepth++;
      const lineNum = lineStarts.findIndex(s => s > i) - 1;
      const col = i - lineStarts[lineNum];
      // Show context
      let context = '';
      for (let j = i; j < Math.min(i + 30, bytes.length); j++) {
        const b = bytes[j];
        context += (b >= 32 && b < 127) ? String.fromCharCode(b) : '?';
      }
      console.log(`Byte ${i} (line ${lineNum+1}): opening <, context: ${context}`);
    }
    else if (bytes[i] === 62) checkDepth--;
  }
  console.log(`Unclosed < count: ${checkDepth}`);
}