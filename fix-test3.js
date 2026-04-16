const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Before: Total lines:', lines.length);
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 927:', JSON.stringify(lines[926]));
console.log('Line 1109:', JSON.stringify(lines[1108]));
console.log('Line 1110:', JSON.stringify(lines[1109]));
console.log('Line 1111:', JSON.stringify(lines[1110]));
console.log('Line 1112:', JSON.stringify(lines[1111]));

// Step 1: Replace line 925 (index 924) - change the commented line to actual code
// From: "// const leftSidebar = null; // removed for debug"
// To:   "const leftSidebar = null;"  (because we're using InsuranceSidebar component now)
lines[924] = ' const leftSidebar = null;';

// Step 2: Delete lines 925-1180 (the commented-out JSX)
// This removes:
//   <div className="space-y-3"> (line 926)
//   through
//   </div> (line 1178)
//   );
//   }
lines.splice(925, 256);  // Remove 256 lines (from index 925 to 1180 inclusive)

// Now lines 925-1110 become:
// Line 925: const leftSidebar = null; (our change)
// Lines 926-1109: same as before (the actual return statement)
// Line 1110 (was 1111): {leftSidebar} - still references leftSidebar

console.log('\nAfter removing JSX block:');
console.log('Total lines:', lines.length);
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 1109:', JSON.stringify(lines[1108]));
console.log('Line 1110:', JSON.stringify(lines[1109]));
console.log('Line 1111:', JSON.stringify(lines[1110]));

// Step 3: Now we need to replace {leftSidebar} with the InsuranceSidebar component
// But InsuranceSidebar expects props... let's check what's available in the component
// We need to figure out what state variables are available

// Actually, looking at the original code, leftSidebar was a JSX value
// Since we set it to null, {leftSidebar} renders nothing
// But the user wants the full insurance page working

// For now, let me check if {leftSidebar} works with leftSidebar=null
// If not, we need to add the InsuranceSidebar with all its props

// Let me just save and test first
const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);
console.log('\nSaved. New file has', newContent.split('\n').length, 'lines');