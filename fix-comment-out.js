const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Strategy: Comment out the getLeftSidebar function definition and usage
// Line 925-927: const getLeftSidebar = () => (\n<>\n<div className="space-y-3">
// Line 1111: {getLeftSidebar()}

// Step 1: Comment out lines 925-927 by adding //
let lineContent = lines.join('\n');

// Find and replace the start of getLeftSidebar
const old = ' const getLeftSidebar = () => (\n<>\n<div className="space-y-3">';
const newOld = ' // const getLeftSidebar = () => (\n// <>\n// <div className="space-y-3">';

if (lineContent.includes(old)) {
  lineContent = lineContent.replace(old, newOld);
  console.log('Replaced getLeftSidebar definition');
} else {
  console.log('WARNING: Pattern not found');
  console.log('Searching for getLeftSidebar...');
  const idx = lineContent.indexOf('const getLeftSidebar');
  console.log('Found at:', idx);
  console.log('Context:', JSON.stringify(lineContent.slice(idx, idx + 150)));
}

// Step 2: Comment out the usage {getLeftSidebar()}
lineContent = lineContent.replace('{getLeftSidebar()}', '{/* getLeftSidebar() */}');
console.log('Replaced getLeftSidebar usage');

fs.writeFileSync(path, lineContent);
const newLines = lineContent.split('\n');
console.log('\nNew line 924:', JSON.stringify(newLines[923]));
console.log('New line 925:', JSON.stringify(newLines[924]));
console.log('New line 926:', JSON.stringify(newLines[925]));
console.log('New line 927:', JSON.stringify(newLines[926]));
console.log('New line 928:', JSON.stringify(newLines[927]));