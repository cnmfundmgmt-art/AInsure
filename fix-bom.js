const fs = require('fs');
const path = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const raw = fs.readFileSync(path);

// Check first 3 bytes for BOM
console.log('First 3 bytes:', raw.slice(0, 3).toJSON().data);
console.log('Has BOM:', raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF);

// Check line 923 raw bytes
const lines = raw.toString('utf8').split('\n');
console.log('\nLine 923:', lines[922]);

// Now let's see if we can identify any weird characters
// Check around the problematic area
const content = raw.toString('utf8');
const bytes = Buffer.from(content, 'utf8');

// Look for any non-ASCII, non-UTF8 sequences
let hasBOM = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
if (hasBOM) {
  console.log('\n*** BOM FOUND - Removing BOM ***');
  const clean = bytes.slice(3);
  fs.writeFileSync(path, clean);
  console.log('BOM removed and file saved');
} else {
  console.log('\nNo BOM found');
}

// Verify the fix
const raw2 = fs.readFileSync(path);
console.log('After fix - first 3 bytes:', raw2.slice(0, 3).toJSON().data);
console.log('File length:', raw2.length);