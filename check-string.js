const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

// Find line starts
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Byte 50894 is in line 921
// Line 921 (0-indexed 920): setClientGoals('Education, Family Protection');
console.log('Line 921 content (lines 920-922):');
for (let i = 920; i <= 922; i++) {
  const start = lineStarts[i];
  const end = lineStarts[i + 1] || bytes.length;
  const line = bytes.slice(start, end).toString('utf8');
  console.log('Line ' + (i + 1) + ' (bytes ' + start + '-' + (end - 1) + '): ' + JSON.stringify(line));
}

// Let me manually check for single quotes in line 921
// Line 921: setClientGoals('Education, Family Protection');
console.log('\n=== Character analysis of line 921 ===');
const line921 = bytes.slice(lineStarts[920], lineStarts[921] - 1);
for (let i = 0; i < line921.length; i++) {
  const b = line921[i];
  if (b === 39 || b === 34 || b === 96) { // quote characters
    const lineOffset = lineStarts[920] + i;
    console.log('Byte ' + lineOffset + ' (pos ' + i + '): char ' + String.fromCharCode(b) + ' (' + b + ')');
  }
}

// Let me specifically look at what happens at bytes 50890-50900
console.log('\n=== Bytes 50890-50900 ===');
for (let i = 50890; i <= 50900; i++) {
  const b = bytes[i];
  console.log(i + ': ' + b + ' (0x' + b.toString(16) + ') = \'' + (b >= 32 && b < 127 ? String.fromCharCode(b) : '?') + '\'');
}

// Now, let me think about this differently
// The parser says "Unexpected token div" at line 925
// This means when it sees the < at the start of <div>, it doesn't think it's starting JSX
// Why would that be?

// In JSX, < starts a tag ONLY when we're in JSX context
// Outside of JSX context, < is the less-than operator
// So the parser must think we're NOT in JSX context at line 925

// What would put us in JSX context?
// - Being inside a JSX element
// - Being in a JSX expression {}

// In JSX, you can write {condition && &lt;Element /&gt;}
// The &amp;&amp; is inside {}, so we're in JSX expression context
// The &lt; after &amp;&amp; starts a JSX tag

// But what if there's a case where &amp;&amp; is NOT inside {} but followed by &lt;?
// Then &lt; would be the less-than operator, not a JSX tag

// Let me look at the last && before line 925 more carefully
console.log('\n=== Last && before line 925 ===');
let lastAndAndPos = -1;
for (let i = 0; i < lineStarts[924]; i++) {
  if (bytes[i] === 38 && bytes[i + 1] === 38) {
    lastAndAndPos = i;
  }
}

if (lastAndAndPos > 0) {
  console.log('Last && at byte ' + lastAndAndPos);
  // Show context
  const ctxStart = Math.max(0, lastAndAndPos - 30);
  const ctxEnd = Math.min(bytes.length, lastAndAndPos + 60);
  console.log('Context: ' + JSON.stringify(bytes.slice(ctxStart, ctxEnd).toString('utf8')));
  
  // Is it inside {} or not?
  // Find the surrounding context
  let inBrace = false;
  let braceCount = 0;
  for (let i = 0; i < lastAndAndPos; i++) {
    if (bytes[i] === 123) { braceCount++; inBrace = true; }
    else if (bytes[i] === 125) { braceCount--; if (braceCount === 0) inBrace = false; }
  }
  console.log('At last &&, inBrace=' + inBrace + ', braceCount=' + braceCount);
}

// Let me try a different approach - check if there are any weird characters in the byte range 50000-51000
console.log('\n=== Checking bytes 50000-51000 for anomalies ===');
for (let i = 50000; i < 51000; i++) {
  const b = bytes[i];
  // Flag: not printable ASCII, not CR/LF/Tab, not bytes > 127 (allow unicode)
  if ((b < 9 || b === 11 || b === 12 || (b >= 14 && b < 32)) && b !== 10 && b !== 13) {
    console.log('Byte ' + i + ' (line ' + lineStarts.findIndex(s => s > i) + '): ' + b + ' (0x' + b.toString(16) + ')');
  }
}