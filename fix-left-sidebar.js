const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace: const getLeftSidebar = () => (\n<>\n<div className="space-y-3">
// With: const getLeftSidebar = () => null;

// But we also need to remove all the JSX content after it up to {getLeftSidebar()}
// and then restore the sidebar functionality properly.

// First, let me check what's around the getLeftSidebar area
const lines = content.split('\n');
console.log('Line 924:', JSON.stringify(lines[923]));
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 927:', JSON.stringify(lines[926]));

// Find where {getLeftSidebar()} is used and what's before it
for (let i = 1078; i <= 1090; i++) {
  console.log((i+1) + ': ' + JSON.stringify(lines[i]));
}

// Strategy: The sidebar state (intakeOpen, historyOpen, clientIncome etc) are in the main component
// We need to move the JSX into the main component, or make it a proper component
// For now, let's just comment out the broken function and fix the build

// Actually - let's try a simpler fix. Use an IIFE pattern that SWC can parse correctly
// const getLeftSidebar = (() => { return ( <div>...</div> ); })()
const oldPattern = ' const getLeftSidebar = () => (\n<>\n<div className="space-y-3">';
const newPattern = ' const getLeftSidebar = (() => { return (';

let newContent = content.replace(oldPattern, newPattern);
if (newContent === content) {
  console.log('ERROR: Pattern not found');
} else {
  console.log('Replaced start pattern');
  fs.writeFileSync(path, newContent);
  console.log('Done');
  console.log('New line 925:', JSON.stringify(newContent.split('\n')[924]));
  console.log('New line 926:', JSON.stringify(newContent.split('\n')[925]));
  console.log('New line 927:', JSON.stringify(newContent.split('\n')[926]));
}