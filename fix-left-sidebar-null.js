const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// In test3, the structure is:
// Line 925: // const leftSidebar = null; // removed for debug
// Line 926: <div className="space-y-3">  <- This is INVALID JSX - at top level of component

// We need to properly comment out the entire leftSidebar JSX block
// The JSX starts at line 926 and goes until the end of the file (line 1181)
// We need to convert it to: const leftSidebar = null;

// Strategy: 
// 1. Replace line 925 with: const leftSidebar = null;
// 2. Comment out lines 926-1180 (the rest of the file)

lines[924] = ' const leftSidebar = null;';
// Comment out lines 925 onwards (index 925 to end)
for (let i = 925; i < lines.length; i++) {
  if (!lines[i].trim().startsWith('//')) {
    if (lines[i].trim() === '') {
      lines[i] = '//';
    } else {
      lines[i] = '// ' + lines[i];
    }
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

console.log('Done. Total lines:', newContent.split('\n').length);
console.log('Line 925:', JSON.stringify(newContent.split('\n')[924]));
console.log('Line 926:', JSON.stringify(newContent.split('\n')[925]));
console.log('Line 927:', JSON.stringify(newContent.split('\n')[926]));
console.log('Line 1100:', JSON.stringify(newContent.split('\n')[1099]));
console.log('Last line:', JSON.stringify(newContent.split('\n').slice(-5)[0]));