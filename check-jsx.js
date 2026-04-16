const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Check brace balance throughout the entire file
let braceCount = 0;
let maxLine = 0;

console.log('Tracing brace balance throughout file...\n');

for (let lineIdx = 0; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const lineBytes = bytes.slice(lineStart, lineEnd);
  
  for (let i = 0; i < lineBytes.length; i++) {
    if (lineBytes[i] === 123) braceCount++;
    else if (lineBytes[i] === 125) braceCount--;
  }
  
  if (lineIdx < 935) {
    const line = lineBytes.toString('utf8').replace(/\n$/, '');
    console.log('Line ' + (lineIdx + 1) + ': brace=' + braceCount + ' | ' + line.substring(0, 70));
  }
}

console.log('\nFinal brace count: ' + braceCount);

// Now look at what line 925 actually looks like in context of the function body
console.log('\n=== Line 925 in context ===');
// The function InsurancePage starts at line 765
// We need to understand what's the state of JSX parsing at line 925

// In JSX, < starts a tag only in certain contexts
// The key is: is the parser in "JSX mode" or not?

// One way to be in JSX mode is to have an open JSX element
// Another way is to be inside a JSX expression {}

// Let me trace JSX-specific patterns
console.log('\n=== Tracing JSX-specific patterns ===');
let inJSXExpression = 0; // inside {} in JSX context

for (let lineIdx = 0; lineIdx < 935; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const line = bytes.slice(lineStart, lineEnd).toString('utf8');
  
  // For each character, track if we're in string, comment, etc.
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const next = i < line.length - 1 ? line[i + 1] : '';
    
    // Skip strings and comments
    if (c === '/' && next === '/') break; // single line comment
    if (c === "'" || c === '"' || c === '`') {
      // Skip string
      const quote = c;
      i++;
      while (i < line.length && line[i] !== quote && line[i] !== '\\') i++;
    }
  }
  
  if (lineIdx >= 924 && lineIdx <= 930) {
    console.log('Line ' + (lineIdx + 1) + ': ' + line.replace(/\n$/, ''));
  }
}

// Now let me check: is there any case where && appears right before < on the same line?
console.log('\n=== Looking for && followed by < ===');
for (let lineIdx = 0; lineIdx < 935; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  const line = bytes.slice(lineStart, lineEnd).toString('utf8');
  
  // Look for && followed by < (possibly with whitespace)
  const andAndIdx = line.indexOf('&&');
  while (andAndIdx !== -1) {
    // Check what follows
    let j = andAndIdx + 2;
    while (j < line.length && line[j] === ' ') j++;
    if (j < line.length && line[j] === '<') {
      console.log('Line ' + (lineIdx + 1) + ': && followed by <');
      console.log('  ' + line.replace(/\n$/, ''));
      console.log('  ' + ' '.repeat(andAndIdx) + '~~&& ' + '~'.repeat(j - andAndIdx - 2) + '<');
    }
    andAndIdx = line.indexOf('&&', andAndIdx + 1);
  }
}

// Check if there's any issue with the className ternary (lines 1040-1046)
// Specifically, look at the structure there
console.log('\n=== Lines 1040-1048 (className ternary) ===');
for (let i = 1039; i <= 1048; i++) {
  if (lineStarts[i]) {
    const line = bytes.slice(lineStarts[i], lineStarts[i + 1] || bytes.length).toString('utf8').replace(/\n$/, '');
    console.log('Line ' + (i + 1) + ': ' + line);
  }
}

// The issue might be that the className ternary crosses multiple lines in a way that confuses SWC
// Let me check if removing the multiline className helps

console.log('\n=== Checking if multiline className is the issue ===');
console.log('The className template literal spans lines 1042-1046');
console.log('Line 1042: className={`...');
console.log('Line 1043:   analysisLoading || clientIncome == null');
console.log('Line 1044:   ? \'bg-gray-200...');
console.log('Line 1045:   : \'bg-indigo-600...');
console.log('Line 1046:   }`}>');

// This is: className={`w-full ... ${condition ? 'a' : 'b'}`}
// The ${} is inside a template literal, so the ternary should be fine
// But maybe SWC has an issue with this pattern?