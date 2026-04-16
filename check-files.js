const fs = require('fs');
const c = fs.readFileSync('app/insurance/page.tsx.test3', 'utf8');
const lines = c.split('\n');

console.log('test3 info:');
console.log('Length:', c.length);
console.log('Lines:', lines.length);
console.log('Line 924 (comment):', JSON.stringify(lines[923]));
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));

// Check what state the file is in - is it directly using JSX without assignment?
// Line 926 is <div className="space-y-3"> which means it's at top level of the component
// This is wrong JSX syntax - can't have bare <div> at top level of a function body

// So the fix for test3 would be to properly comment out or wrap this code
// But we're trying to get bak6 to build

// Let me just try to build bak6 and see what error we get
console.log('\n--- Checking bak6 build readiness ---');
const fs2 = require('fs');
const bak6 = fs2.readFileSync('app/insurance/page.tsx.bak6', 'utf8');
const bak6Lines = bak6.split('\n');
console.log('bak6 line 924:', JSON.stringify(bak6Lines[923]));
console.log('bak6 line 925:', JSON.stringify(bak6Lines[924]));
console.log('bak6 line 926:', JSON.stringify(bak6Lines[925]));
console.log('bak6 line 927:', JSON.stringify(bak6Lines[926]));

// bak6 has: const getLeftSidebar = () => (\n<>\n<div className="space-y-3">
// The <> at line 926 is the problem

console.log('\n--- Checking test (the one with commented leftSidebar) ---');
const test = fs2.readFileSync('app/insurance/page.tsx.test', 'utf8');
const testLines = test.split('\n');
console.log('test line 924:', JSON.stringify(testLines[923]));
console.log('test line 925:', JSON.stringify(testLines[924]));
console.log('test line 926:', JSON.stringify(testLines[925]));
console.log('test line 927:', JSON.stringify(testLines[926]));
// test has leftSidebar commented, so the <div at 926 should be fine as part of normal JSX flow