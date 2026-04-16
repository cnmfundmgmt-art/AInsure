const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// bak6 structure:
// 925: const getLeftSidebar = () => (
// 926: <>
// 927: <div className="space-y-3">
// ...
// 1082: </div>
// 1083: </div>
// 1084: );
// 1085: (empty)
// 1086: return (

// Strategy: comment out the entire getLeftSidebar function including its closing );
// From line 925 to line 1084 (inclusive)
// Then the actual page return is at 1086+

// Comment each line from 925 to 1084 by adding // at the start
for (let i = 924; i <= 1084; i++) {
  if (lines[i].trim().startsWith('//')) {
    // Already commented, add another //
    lines[i] = '//' + lines[i];
  } else if (lines[i].trim() === '') {
    // Empty line, add //  
    lines[i] = '//';
  } else {
    // Non-comment, non-empty - add //
    lines[i] = '// ' + lines[i];
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = newContent.split('\n');
console.log('Line 924:', JSON.stringify(newLines[923]));
console.log('Line 925:', JSON.stringify(newLines[924]));
console.log('Line 926:', JSON.stringify(newLines[925]));
console.log('Line 1084:', JSON.stringify(newLines[1083]));
console.log('Line 1085:', JSON.stringify(newLines[1084]));
console.log('Line 1086:', JSON.stringify(newLines[1085]));
console.log('Line 1087:', JSON.stringify(newLines[1086]));