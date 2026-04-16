const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Current state: line 925 is "// const leftSidebar = null; // removed for debug"
// Line 926 is " <div className="space-y-3">" (invalid bare JSX at function level)

// Fix: Use an IIFE to wrap the JSX so SWC can parse it
// Line 925: const leftSidebar = (() => { return (
// Line 926+: <div className="space-y-3"> and all the sidebar content
// Line 1180: ); })();

// But wait - the current line 925 is commented. We need to uncomment and change it.
// And we need to change line 1180 from:
//   );
// }
// To:
//   );
//   })();

console.log('Before:');
console.log('Line 924:', JSON.stringify(lines[923]));
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));
console.log('Line 1179:', JSON.stringify(lines[1178]));
console.log('Line 1180:', JSON.stringify(lines[1179]));

// Fix: uncomment line 925 and change to IIFE start
lines[924] = ' const leftSidebar = (() => { return (';

// Fix: change the closing
lines[1178] = '   }); })();';
// We need to add the }); before the ); for the IIFE

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

console.log('\nAfter:');
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Line 924:', JSON.stringify(newLines[923]));
console.log('Line 925:', JSON.stringify(newLines[924]));
console.log('Line 926:', JSON.stringify(newLines[925]));
console.log('Line 1178:', JSON.stringify(newLines[1177]));
console.log('Line 1179:', JSON.stringify(newLines[1178]));
console.log('Line 1180:', JSON.stringify(newLines[1179]));