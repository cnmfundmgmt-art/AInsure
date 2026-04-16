const fs = require('fs');

// Check what we have and try to restore from the original working state
// We need to get the original file that had the SWC parsing issue

// Since we can't restore from git (untracked file), let's try to figure out 
// what the original structure was and rebuild it properly

// Let me check if there's a backup or we can find the original structure
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Current lines:', lines.length);

// Find the getLeftSidebar section and fix it properly
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getLeftSidebar')) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) {
  console.log('ERROR: Cannot find getLeftSidebar');
  process.exit(1);
}

console.log('getLeftSidebar starts at line', startIdx + 1);

// Find the export line
let exportIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function InsurancePage')) {
    exportIdx = i;
    break;
  }
}
console.log('InsurancePage export at line', exportIdx + 1);

// The section from startIdx to exportIdx-1 should be the getLeftSidebar declaration
// But the structure is broken - let me find the actual end

// Look at what's between startIdx and exportIdx
console.log('\nLines around the problematic area:');
for (let i = startIdx; i <= Math.min(startIdx + 10, exportIdx - 1); i++) {
  console.log((i+1) + ': ' + lines[i]);
}

console.log('\nLines near export:');
for (let i = exportIdx - 5; i <= exportIdx + 5; i++) {
  if (i >= 0 && i < lines.length) {
    console.log((i+1) + ': ' + lines[i]);
  }
}

// The current file is 1177 lines, original should be around 1181
// The issue is we've lost the proper closing structure

// Let me just fix the immediate problem: the getLeftSidebar needs proper closing
// Current structure is broken. I need to:
// 1. Ensure the JSX is properly closed with </> and );
// 2. Make sure there's no extra garbage

// Let me find where the function should end
// Starting from exportIdx, look backwards for the getLeftSidebar closing pattern

// Find the line ")}" which should close the arrow function
// It should be somewhere before exportIdx

let closeIdx = -1;
for (let i = exportIdx - 1; i >= startIdx; i--) {
  const trim = lines[i].trim();
  if (trim === ');' || trim === ')}') {
    closeIdx = i;
    break;
  }
}

console.log('\nFound closing at line', closeIdx + 1, ':', lines[closeIdx]);

// Now let's check what comes after closeIdx to exportIdx
console.log('\nBetween closeIdx and exportIdx:');
for (let i = closeIdx; i <= exportIdx; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// The structure should be:
// ... content ...
// </div>          (closes the space-y-3 div)  
// </>             (closes the fragment)  
// );             (closes the arrow function)
// }              (closes InsurancePage function - this is line 1180 in original)
// empty line
// export...

// If we're missing </>, that's the bug
// Let me check if we have </>

const hasCloseFragment = lines.some(l => l.trim() === '</>');
console.log('\nHas </>:', hasCloseFragment);

// If no </>, we need to add it before the );

// The current closeIdx likely has just:
// );
// And we need:
// </>
// );

console.log('\nCurrent line at closeIdx:', JSON.stringify(lines[closeIdx]));
console.log('Current line at closeIdx+1:', JSON.stringify(lines[closeIdx + 1]));

// Check if we need to insert </> before the );
if (lines[closeIdx].trim() === ');' && !hasCloseFragment) {
  console.log('\nNeed to insert </> before );');
  
  // Insert </> at closeIdx position
  lines[closeIdx] = ' </>';
  // Then insert ); on the next line
  lines.splice(closeIdx + 1, 0, ' );');
  
  console.log('Fixed. New lines around there:');
  for (let i = closeIdx - 2; i <= closeIdx + 4; i++) {
    if (i >= 0 && i < lines.length) {
      console.log((i+1) + ': ' + lines[i]);
    }
  }
  
  fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', lines.join('\n'), 'utf8');
  console.log('\nFile saved');
}

// Test build
const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED!');
} catch (e) {
  console.log('BUILD FAILED:');
  console.log(e.stdout ? e.stdout.toString().substring(0, 2500) : 'no output');
}