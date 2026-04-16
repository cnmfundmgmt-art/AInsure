const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Check: the onClick at line 929 has an expression with &&
// onClick={() => setIntakeOpen(!intakeOpen)}
// Wait, that's not &&, that's ! (not)

// Let me trace through the JSX structure more carefully
// Maybe there's a missing > somewhere that's causing confusion

// Actually, let me look at the specific issue - the SWC parser error says
// it sees "Unexpected token div" at line 925
// This means at line 925, after parsing some construct, it sees <div and
// expects something else (like an identifier)

// The key question is: what construct is open when we reach line 925?

// Let me trace the nesting:
console.log('Tracing nesting around line 925...\n');

// Find all open/close patterns that matter
// For JSX, we track: < (open tag), > (close tag), { (open expr), } (close expr)

// Let's look at the raw bytes again but this time track all context
const bytes = Buffer.from(content, 'utf8');

// Find line 925 start
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

const line925Start = lineStarts[924];
const line925End = lineStarts[925];

console.log('Line 925 content (raw bytes from', line925Start, 'to', line925End - 1, '):');
for (let i = line925Start; i < line925End; i++) {
  const b = bytes[i];
  const char = (b >= 32 && b < 127) ? String.fromCharCode(b) : `\\${b}`;
  process.stdout.write(char);
}
console.log('\n');

// Now let's check what open constructs we have before line 925
// Specifically, let me look for any incomplete JSX tag BEFORE line 925
// that might be waiting for a >

console.log('Searching for incomplete tags before line 925...');

// Find any < that's followed by a tag name but not closed before line 925
let i = 0;
while (i < line925Start) {
  if (bytes[i] === 60) { // <
    // Check if it's followed by a tag name pattern (letter)
    const next1 = bytes[i + 1];
    const next2 = bytes[i + 2];
    if ((next1 >= 65 && next1 <= 90) || (next1 >= 97 && next1 <= 122)) {
      // It's a tag opening
      // Find where this tag closes (the >)
      let j = i + 1;
      while (j < line925Start && bytes[j] !== 62) j++;
      const tagContent = bytes.slice(i, j + 1).toString('utf8');
      console.log(`Byte ${i} (line ${lineStarts.findIndex(s => s > i)}): tag = "${tagContent}"`);
    }
  }
  i++;
}

// Check for any unclosed angle brackets with && or || before line 925
console.log('\nChecking for && or || that might contain <...');
for (let i = 0; i < line925Start; i++) {
  if (bytes[i] === 38 && bytes[i+1] === 38) {
    // Found &&
    const context = bytes.slice(Math.max(0, i - 10), Math.min(bytes.length, i + 30)).toString('utf8');
    console.log(`&& at byte ${i}: ${context}`);
  }
}