const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix the 'welcome' case - the issue is that after the closing </div> of the welcome case content,
// we have {msg.suggestions ? ( which should be INSIDE the JSX returned by the case 'welcome' return

// Current structure (broken):
// case 'welcome': return (
//   <div className="space-y-4">
//     ...content...
//     <p>...</p>
//   </div>        <- closes the space-y-4 div at line 343
//   {msg.suggestions ? (   <- OUTSIDE the return, this is wrong JSX
//     ...suggestions...
//   )}
// );

// Correct structure:
// case 'welcome': return (
//   <div className="space-y-4">
//     ...content...
//     <p>...</p>
//     {msg.suggestions ? (
//       <div className="flex flex-wrap gap-2">
//         ...suggestions...
//       </div>
//     ) : null}
//   </div>
// );

// The </div> at line 343 should be moved to AFTER the suggestions block
// So line 343 should become: </div>  <- this closes the gradient bg div
// And we need a NEW </div> after line 351 to close the space-y-4

// But wait, looking at line 343: ' </div>' - this closes the bg gradient div
// And we have another </div> at line 350: ' </div>' which closes flex-wrap gap-2
// And line 351: ' )}' closes the ternary
// Then line 352: ' );' closes the return

// But the space-y-4 div opened at line 329 has NO closing tag!
// The space-y-4 div opened at 329 needs a </div> BEFORE the );
// Currently we have:
// 329: <div className="space-y-4">   <- opens
// ...
// 343: </div>  <- closes bg-gradient div
// 344: {msg.suggestions ? (   <- still inside space-y-4
// 345: <div className="flex flex-wrap gap-2">
// ...
// 350: </div>  <- closes flex-wrap
// 351: )}       <- closes ternary
// 352: );       <- closes return - BUT space-y-4 div is NOT closed!

// So we need to add </div> before );
// But we also need to properly structure the conditional

// Let me fix this:
lines[342] = ' </div>';  // This closes the bg-gradient div at line 330
lines[343] = ' {msg.suggestions ? (';  // Inside space-y-4 now
lines[344] = '   <div className="flex flex-wrap gap-2">';
lines[345] = '     {(msg.suggestions !== null ? (msg.suggestions as string[]) : []).map((s) => (';
lines[346] = '       <button key={s} onClick={() => window.dispatchEvent(new CustomEvent(\'suggestion\', { detail: s }))}';
lines[347] = '         className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-50 transition">{s}</button>';
lines[348] = '     ))}';
lines[349] = '   </div>';
lines[350] = ' ) : null}';
lines[351] = ' </div>';  // This closes space-y-4
lines[352] = ' );';

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 328-355:');
for (let i = 327; i <= 355; i++) console.log((i+1) + ': ' + newLines[i]);