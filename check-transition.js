const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path);
const bytes = Buffer.from(content, 'utf8');

// Get line starts
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Line 923 (0-indexed 922) ends at lineStarts[923]
// Line 925 (0-indexed 924) starts at lineStarts[924]
// Let me look at the transition from line 923 to 925

console.log('=== Lines 922-925 ===');
const line922 = bytes.slice(lineStarts[921], lineStarts[922]).toString('utf8');
const line923 = bytes.slice(lineStarts[922], lineStarts[923]).toString('utf8');
const line924 = bytes.slice(lineStarts[923], lineStarts[924]).toString('utf8');
const line925 = bytes.slice(lineStarts[924], lineStarts[925]).toString('utf8');

console.log('Line 922 (end of file section):', JSON.stringify(line922));
console.log('Line 923:', JSON.stringify(line923));
console.log('Line 924 (empty):', JSON.stringify(line924));
console.log('Line 925:', JSON.stringify(line925));

// Check the bytes between line 923 end and line 925 start
console.log('\n=== Bytes around the transition ===');
const end923 = lineStarts[923] - 1; // The \n of line 923
const start925 = lineStarts[924]; // Start of line 925
console.log(`Line 923 ends at byte ${end923}, Line 925 starts at byte ${start925}`);
console.log(`Gap bytes ${end923 + 1} to ${start925 - 1}:`);
for (let i = end923 + 1; i < start925; i++) {
  const b = bytes[i];
  const char = b >= 32 && b < 127 ? String.fromCharCode(b) : `.`;
  console.log(`  ${i}: ${b.toString().padStart(3)} = '${char}'`);
}

// Let me also look at the line BEFORE line 922 (the comment) and what leads up to line 923
console.log('\n=== Context before line 922 ===');
for (let i = 918; i <= 925; i++) {
  if (i < lineStarts.length) {
    const line = bytes.slice(lineStarts[i - 1], lineStarts[i] - 1).toString('utf8');
    console.log(`Line ${i}: ${JSON.stringify(line)}`);
  }
}

// Check for any special invisible characters in the file
console.log('\n=== Searching for any 0x00 or other invisible bytes ===');
let found = false;
for (let i = 0; i < bytes.length; i++) {
  const b = bytes[i];
  if ((b < 9 || (b > 10 && b < 13) || b === 0) && i < lineStarts[930]) {
    console.log(`Byte ${i} (line ${lineStarts.findIndex(s => s > i)}): ${b}`);
    found = true;
  }
}
if (!found) console.log('No invisible bytes found in first 930 lines');

// What about checking if there's a stray quote or backtick that opens a string?
console.log('\n=== Checking for unclosed strings before line 925 ===');
let inString = false;
let stringChar = null;
let stringStart = 0;
let line = 0;
let col = 0;
let i = 0;

while (i < bytes.length && line < 925) {
  if (bytes[i] === 10) {
    line++;
    col = 0;
  } else {
    col++;
  }
  
  if (!inString) {
    if (bytes[i] === 39 || bytes[i] === 34 || bytes[i] === 96) { // ' or " or `
      inString = true;
      stringChar = bytes[i];
      stringStart = i;
    }
  } else {
    if (bytes[i] === stringChar && (bytes[i - 1] !== 92 || bytes[i - 2] === 92)) { // Not escaped
      inString = false;
    }
  }
  
  if (line >= 925) break;
  i++;
}

if (inString) {
  console.log(`UNCLOSED STRING starting at byte ${stringStart} (line ${lineStarts.findIndex(s => s > stringStart)})`);
  const ctxStart = Math.max(0, stringStart - 20);
  const ctxEnd = Math.min(bytes.length, stringStart + 50);
  console.log('Context:', bytes.slice(ctxStart, ctxEnd).toString('utf8'));
} else {
  console.log('No unclosed strings before line 925');
}