const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Fix 1: Remove <> fragment opening at line 925 (0-indexed 924)
// Original: " const getLeftSidebar = () => ("
// Changed to: " const getLeftSidebar = () => ("
// But we added <> which we need to remove
// Current line 925 (0-indexed 924): "<>"
// Should be removed - the JSX starts directly with <div>

// Fix 2: At the end of getLeftSidebar, add </> to close the fragment
// Current lines 1174-1181:
// 1174: </div>
// 1175: )}    <-- This closes a conditional
// 1176: </div>  <-- Extra div that shouldn't be here (from the old closing)
// 1177: </div>
// 1178: </div>
// 1179: );       <-- This closes the arrow function - THIS IS CORRECT, NO CHANGE
// 1180: }        <-- This closes InsurancePage function
// We need: 1174: </div>, 1175: </>, 1176: );

// Actually let me look at the current state more carefully
console.log('\nLines around getLeftSidebar end:');
for (let i = 1170; i <= 1182; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

console.log('\nLines 924-928:');
for (let i = 923; i <= 927; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// Let me create a fixed version
const newLines = [...lines];

// Fix 1: Remove line 925 (the <> fragment opening)
if (newLines[924].trim() === '<>') {
  newLines[924] = newLines[924].replace('<>', '').trimEnd();
  if (newLines[924] === '') {
    newLines.splice(924, 1); // Remove empty line
  }
  console.log('Removed <> fragment opening');
}

// Now find the end of getLeftSidebar - look for the pattern
// The arrow function was: const getLeftSidebar = () => (
// It should close with just: );
// Find the line that has " );" that closes the arrow function
// This is around line 1179-1180

// Current problematic area:
// 1174: </div>
// 1175: )}    <- This )} closes a conditional that opened with {clientIncome == null && (
// 1176: </div> <- This is an EXTRA closing div that doesn't belong
// 1177: </div>
// 1178: </div>
// 1179: );     <- This should close the arrow function

// Wait, let me re-examine. The pattern in the original was:
// {clientIncome == null && (
//   <div className="p-3 space-y-3">
//     ...
//   </div>
// )}
// So the )} on line 1175 is correct - it closes the conditional {clientIncome == null && (...)}
// But there's an extra </div> on line 1176...

// Actually I think the issue is that I added an extra </div> somewhere
// Let me count the divs carefully in the original structure

// The original structure had:
// </div>  </div>  );   (lines 1177, 1178, 1179)
// But now we have:
// </div> )} </div> </div> </div> );  (1174-1179)

// Let me check what the original file had before my changes
// The original lines were:
// 1177: </div>
// 1178: </div>
// 1179: );
// 1180: }
// Now they are:
// 1174: </div>
// 1175: )}    <-- extra closing for conditional
// 1176: </div> <-- extra div
// 1177: </div>
// 1178: </div>
// 1179: );
// 1180: }

// I think the issue is:
// 1. Line 1175 )} is the normal closing of the conditional that wraps the income null message
// 2. But then lines 1176-1178 add 3 more </div> when there should only be 2

// Looking at the original closing structure (before my changes):
// The getLeftSidebar returned:
//   <div className="space-y-3">  <- outer wrapper div
//     ...content...
//   </div>                          <- closes outer wrapper div
//   );
// So 2 closing divs total, then );

// But now we have:
//   </div>   <- closes the last content div (probably the "no income" message div)
//   )}       <- closes the {clientIncome == null && (...)} conditional
//   </div>   <- extra, shouldn't be here
//   </div>   <- extra, shouldn't be here  
//   </div>   <- extra, shouldn't be here
//   );

// Let me just fix it properly by removing the extra </div> lines
// Lines 1176, 1177, 1178 are the extra divs (indices 1175, 1176, 1177 in 0-indexed)

// Actually wait - let me re-read the structure
console.log('\nChecking the conditional structure around line 1170-1175:');
for (let i = 1168; i <= 1178; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// The key question: does the original file have 3 closing </div> before );
// or 2?

// Let me try a different approach - rebuild the file correctly
// First, let me undo all my changes and start fresh with a clean fix

// Actually let me just write the correct lines directly
// The correct ending should be:
// 1174: </div>   (closes the p flex center div in the "no product selected" case)
// 1175: </div>   (closes the conditional wrapper for product detail panel)
// 1176: );
// 1177: }
// (no lines 1178-1181)

// But the current file has:
// 1174: </div>
// 1175: )}    <-- This is wrong - it adds an extra }
// 1176: </div>
// 1177: </div>
// 1178: </div>
// 1179: );
// 1180: }

// I need to remove lines 1175, 1176, 1177 (the extra closing structure)

// Let me do this programmatically
const fixedLines = [...newLines];

// Remove the extra lines after line 1174
// Line 1175 (0-indexed 1174) is )} - should be removed
// Line 1176 (0-indexed 1175) is </div> - should be removed
// Line 1177 (0-indexed 1176) is </div> - should be removed
// Line 1178 (0-indexed 1177) is </div> - should be removed

// But wait - if I remove these, the structure will be wrong
// Let me think more carefully

// The original structure was:
// </div>   (line 1177)
// </div>   (line 1178)  
// );       (line 1179)
// }        (line 1180)

// My modified structure is:
// </div>   (1174)
// )}       (1175) <-- extra
// </div>   (1176) <-- extra
// </div>   (1177) <-- extra
// </div>   (1178) <-- extra
// );       (1179)
// }        (1180)

// So I added lines 1175, 1176, 1177 - 3 extra lines
// I need to remove lines 1175, 1176, 1177 (the three extra closes after line 1174)

// Actually let me trace back what I did:
// I had `</div> </div> );` in the original, and I changed it to `</div> </div> </div> </div> );`
// by adding `</> );` then `</div> </div> </div> ` 

// Looking at my edit:
// old text: `</div> ); }`
// new text: `</div> </> ); }`

// So I added `</>` between `</div>` and `);`
// But I also somehow added extra </div> lines...

// Actually I think the issue is that line 1175 is `)}` which was NOT there in the original
// Let me check the original file structure

// The pattern after ProductDetailPanel section in the original was:
// ) : (
//   <div>...</div>
// )}
// </div>
// </div>
// );
// }

// But now we have:
// ) : (
//   <div>...</div>
// )}
// </div>   <-- extra
// </div>   <-- extra
// </div>   <-- extra
// );
// }

// The extra three </div> are the problem

// Let me fix by removing lines 1176, 1177, 1178 (indices 1175, 1176, 1177)
console.log('\nRemoving extra lines...');
console.log('Before removal, lines 1174-1180:');
for (let i = 1173; i <= 1179; i++) {
  console.log((i+1) + ': ' + fixedLines[i]);
}

// Remove lines 1176, 1177, 1178 (indices 1175, 1176, 1177)
fixedLines.splice(1175, 3);

console.log('\nAfter removal, lines 1174-1180:');
for (let i = 1173; i <= Math.min(1179, fixedLines.length - 1); i++) {
  console.log((i+1) + ': ' + fixedLines[i]);
}

// Now verify the file is correct
console.log('\nFile length after fix:', fixedLines.length);

// Save the fixed file
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', fixedLines.join('\n'), 'utf8');
console.log('File saved');

// Now test build
const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED!');
} catch (e) {
  console.log('BUILD FAILED:');
  console.log(e.stdout ? e.stdout.toString().substring(0, 2000) : 'no output');
}