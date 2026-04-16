const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Check specific lines
for (let i = 334; i <= 344; i++) {
  const line = lines[i];
  if (line) {
    // Check for non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(line);
    const chars = [];
    for (let j = 0; j < line.length; j++) {
      if (line.charCodeAt(j) > 127) {
        chars.push({ pos: j, char: line[j], code: line.charCodeAt(j) });
      }
    }
    console.log(`Line ${i+1}: ${hasNonAscii ? 'HAS NON-ASCII' : 'all ASCII'}`);
    if (chars.length > 0) console.log('  Non-ASCII chars:', JSON.stringify(chars));
    // Show first 80 chars
    console.log('  Content:', JSON.stringify(line.substring(0, 80)));
  }
}

// Check around line 923 (0-indexed 922)
console.log('\n--- Around line 923 ---');
for (let i = 920; i <= 928; i++) {
  if (lines[i]) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}