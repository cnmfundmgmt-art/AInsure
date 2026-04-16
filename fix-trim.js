const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 927:', JSON.stringify(lines[926]));
console.log('Line 928:', JSON.stringify(lines[927]));
console.log('Line 1100:', JSON.stringify(lines[1099]));
console.log('Last 5 lines:', JSON.stringify(lines.slice(-5)));

// The problem: lines 927 onwards contain the old leftSidebar JSX content
// We need to DELETE all lines from 927 (the first <div className="space-y-3">) to the end
// because we're now using InsuranceSidebar component instead

// Keep only lines 1-926 (index 0-925)
const newContent = lines.slice(0, 926).join('\n');

fs.writeFileSync(path, newContent);
console.log('\nNew file length:', newContent.split('\n').length);
console.log('Last 3 lines:', JSON.stringify(newContent.split('\n').slice(-3)));