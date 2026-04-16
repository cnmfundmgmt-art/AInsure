const fs = require('fs');
const path = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

// Find line starts
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Trace angle bracket depth throughout the file
console.log('=== Tracing all < > that affect JSX parsing ===');
// Only count < that are followed by a tag name pattern (letter), not operators
let angleDepth = 0;
let unclosedStack = [];

for (let lineIdx = 0; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  // Process each character
  let i = lineStart;
  while (i < lineEnd) {
    const b = bytes[i];
    
    if (b === 60) { // <
      // Check what follows
      const remaining = lineEnd - i;
      if (remaining >= 3) {
        const next1 = bytes[i + 1];
        // If followed by letter, it's a tag open
        if ((next1 >= 65 && next1 <= 90) || (next1 >= 97 && next1 <= 122)) {
          // It's a tag
          angleDepth++;
          unclosedStack.push({ byte: i, line: lineIdx + 1 });
        }
      }
    } else if (b === 62) { // >
      if (angleDepth > 0) {
        angleDepth--;
        unclosedStack.pop();
      }
    }
    
    i++;
  }
}

console.log('Final angle depth:', angleDepth);
console.log('Unclosed tags:', unclosedStack.length);

// Find unclosed tags
if (unclosedStack.length > 0) {
  console.log('\n=== Unclosed tags ===');
  for (const tag of unclosedStack) {
    // Show context around this tag
    const ctxStart = Math.max(0, tag.byte - 10);
    const ctxEnd = Math.min(bytes.length, tag.byte + 40);
    const ctx = bytes.slice(ctxStart, ctxEnd).toString('utf8');
    console.log(`Line ${tag.line}, byte ${tag.byte}: ${ctx}`);
  }
}

// Also check the closing pattern before line 925
console.log('\n=== Context around line 925 ===');
const line925Start = lineStarts[924]; // 0-indexed line 924 = line 925
for (let i = line925Start - 50; i < line925Start + 50; i++) {
  if (i >= 0 && i < bytes.length) {
    const b = bytes[i];
    const char = (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
    console.log(`${i}: ${b.toString().padStart(3)} = '${char}'`);
  }
}