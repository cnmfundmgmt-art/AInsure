const fs = require('fs');

// Restore from original structure - I'll rebuild the getLeftSidebar correctly

// The file currently has problems. Let me fix it by rewriting the problematic section.

// Current state:
// - Line 924: const getLeftSidebar = ()
// - Line 925: <>  (fragment opening)
// - Lines 925-1175: JSX content
// - Line 1174: )}  (closes a conditional)
// - Line 1175: </div>
// - Line 1176: }   (closes function - WRONG!)
// - Missing: </> to close the fragment

// The correct structure should be:
// const getLeftSidebar = () => (
//   <>  (fragment opening - keeps the JSX group together)
//   <div className="space-y-3"> (outer wrapper)
//   ... all the inner content ...
//   </div> (closes outer wrapper)
//   </> (closes fragment - KEY!)
// );

// But we also need to change the usage from {leftSidebar} to {getLeftSidebar()}

// Let me write a fix script that does this properly

// Read current file
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Find the getLeftSidebar lines
const startIdx = lines.findIndex(l => l.includes('const getLeftSidebar'));
console.log('getLeftSidebar starts at line:', startIdx + 1);

// Find the end of the JSX - we need to find the closing pattern
// The JSX ends where the function body closes, which should be:
//   </div>  (closing the outer space-y-3 div)
//   </>     (closing the fragment - ADD THIS)
//   );      (closing the arrow function)

// Find the line that should close the outer <div className="space-y-3">
// It should be a single </div> followed by );
// Let me look at the current structure around the end

console.log('\nLines 1170-1180:');
for (let i = 1169; i <= 1179; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// The current structure has:
// 1174: )}  (this is from a conditional {condition && ()})
// 1175: </div>  (this should be the closing of the space-y-3 div)
// 1176: }  (this is the function closing brace - BUT THIS IS WRONG)

// Wait - if line 1176 is }, that means the InsurancePage function is closing there
// But we still have more content after getLeftSidebar

// Actually I think the problem is more fundamental - the file structure is completely broken
// from my earlier edits. Let me just rewrite the section completely.

// Strategy: Write the complete getLeftSidebar section from scratch
// and splice it into the file at the right place

// Let me find where the original leftSidebar was (lines 925-1182)
// And replace it with a properly structured getLeftSidebar

// First, find the return statement of InsurancePage and see where getLeftSidebar is used
console.log('\nSearching for getLeftSidebar usage...');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('getLeftSidebar')) {
    console.log('Line', i + 1, ':', lines[i]);
  }
}

// The fix should be:
// 1. Line 925: const getLeftSidebar = () => (
//    <> 
//      <div className="space-y-3">
// 2. Content
// 3. End:   </div>
//           </>
//           );

// Let me create a fresh approach - I'll create a clean version of just the getLeftSidebar section
const getLeftSidebarContent = ` const getLeftSidebar = () => (
 <>
 <div className="space-y-3">
 {/* Client Intake */}
 <div className="border border-gray-200 rounded-xl overflow-hidden">
 <button onClick={() => setIntakeOpen(!intakeOpen)}
 className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-xs font-semibold text-gray-700">
 <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Client Intake</span>
 {intakeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
 </button>
 {intakeOpen && (
 <div className="p-3 space-y-3">
 {/* IC Scan */}
 <div>
 <p className="text-xs font-medium text-gray-600 mb-1.5">1. Scan MyKad (recommended)</p>
 <ICScanUpload onExtracted={handleICExtracted} />
 </div>
 <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><p className="relative flex justify-center text-xs text-gray-400 bg-white px-2">or enter manually</p></div>
 {/* Manual fields */}
 <div className="space-y-2">
 {[
 { label: 'Full Name', value: clientName, onChange: setClientName, placeholder: 'e.g. Ahmad bin Ali' },
 { label: 'IC Number', value: clientIC, onChange: setClientIC, placeholder: 'e.g. 890123456789' },
 { label: 'Date of Birth', value: clientDob, onChange: setClientDob, placeholder: 'DD/MM/YYYY' },
 ].map(({ label, value, onChange, placeholder }) => (
 <div key={label}>
 <label className="text-xs text-gray-500 mb-0.5 block">{label}</label>
 <input
 type="text"
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
 />
 </div>
 ))}
 <div>
 <label className="text-xs text-gray-500 mb-0.5 block">Annual Income (RM)</label>
 <input
 type="number"
 value={clientIncome ?? ''}
 onChange={e => setClientIncome(e.target.value ? parseInt(e.target.value) : null)}
 placeholder="e.g. 60000"
 className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
 />
 </div>
 <div>
 <label className="text-xs text-gray-500 mb-0.5 block">Dependents</label>
 <input
 type="number"
 value={clientDependents ?? ''}
 onChange={e => setClientDependents(e.target.value ? parseInt(e.target.value) : null)}
 placeholder="0"
 min="0"
 className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
 />
 </div>
 {clientDependents > 0 && (
 <div>
 <label className="text-xs text-gray-500 mb-0.5 block">Goals</label>
 <select
 value={clientGoals}
 onChange={e => setClientGoals(e.target.value as string)}
 className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300"
 >
 <option value="">Select goal...</option>
 <option value="Education">Education</option>
 <option value="Family Protection">Family Protection</option>
 <option value="Retirement">Retirement</option>
 <option value="Savings">Savings</option>
 <option value="Investment">Investment</option>
 </select>
 </div>
 )}
 </div>
 {clientIncome == null && (
 <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
 <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Enter income above to begin
 </p>
 )}
 {clientIncome != null && (
 <button
 onClick={handleStartAnalysis}
 disabled={analysisLoading}
 className={\`w-full flex items-center justify-center gap-2 text-sm font-bold rounded-xl px-4 py-3 transition-all shadow-sm \${
 analysisLoading
 ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
 : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white'
 }\`}>
 {analysisLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><PlusCircle className="w-4 h-4" /> Start Analysis</>}
 </button>
 )}
 {clientIncome == null && (
 <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
 <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Enter annual income above to begin
 </p>
 )}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Session History */}
 <div className="border border-gray-200 rounded-xl overflow-hidden">
 <button onClick={() => setHistoryOpen(!historyOpen)}
 className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-xs font-semibold text-gray-700">
 <span className="flex items-center gap-2"><History className="w-3.5 h-3.5" /> View History</span>
 {historyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
 </button>
 {historyOpen && (
 <div className="p-3">
 <SessionHistory onSelectSession={handleSelectSession} />
 </div>
 )}
 </div>

 {/* Product Browser */}
 <div>
 <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Product Browser</p>
 <ProductBrowser onSelectProduct={id => { setSelectedProductId(id); setShowRight(true); }} />
 </div>
 </div>
 </>
 );
`;

// Now I need to find where the original getLeftSidebar section starts and ends
// and replace it with the clean version above

// Find start: line with "const getLeftSidebar"
let startLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const getLeftSidebar')) {
    startLine = i;
    break;
  }
}

// Find end: look for the pattern that closes the function
// The end should be around the ")}" that closes the arrow function
// But I need to be careful - there might be multiple ")}" patterns

// Let me find where "export default function InsurancePage" is (line 765)
// And work backwards from there to find the end of getLeftSidebar

// Actually, the cleanest approach is:
// 1. Find startLine (const getLeftSidebar)
// 2. Find the next line that starts with "}" AND is at the same brace depth as the function body
// This should be around line 1180-1182

// Let me trace the structure more carefully
console.log('\nFinding end of getLeftSidebar...');

// Look for pattern: the line that closes the getLeftSidebar JSX
// It should be right before "export default function InsurancePage"
// Let me find the export line
let exportLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function InsurancePage')) {
    exportLine = i;
    break;
  }
}
console.log('InsurancePage export at line', exportLine + 1);

// The getLeftSidebar should end a few lines before exportLine
// Looking at the original structure, it ends around lines 1178-1182

// Let me check what's between getLeftSidebar start and export
console.log('\nLines between getLeftSidebar start and export:');
console.log('getLeftSidebar starts at line', startLine + 1);
console.log('Lines', startLine + 1, 'to', exportLine, 'should be replaced');

// Actually let me just look at what comes right before the export
console.log('\nLines before export (65-75):');
for (let i = 64; i <= 74; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// OK I think the file is completely broken. Let me take a different approach:
// Restore from a known good state or rebuild the section entirely

// Since I can't easily restore, let me write a script that:
// 1. Finds the getLeftSidebar section
// 2. Replaces it entirely with a clean version
// 3. Ensures the usage is also updated

// First, let me understand the current broken state
console.log('\nCurrent file state around getLeftSidebar:');
for (let i = startLine; i <= Math.min(startLine + 10, lines.length - 1); i++) {
  console.log((i+1) + ': ' + lines[i]);
}

console.log('\nLines near the end of getLeftSidebar:');
for (let i = Math.max(0, lines.length - 20); i <= lines.length - 1; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// The file has 1177 lines. If the original had 1181 lines and I removed 4,
// the structure is definitely off. 

// Let me just write out what the correct file should look like
// and replace the entire content.

// Actually, the simplest fix is:
// 1. Remove the entire getLeftSidebar section
// 2. Add it back properly

// Let me find the complete section to remove
// startLine = line with "const getLeftSidebar"
// endLine = the line before "export default function InsurancePage" that closes it

// Actually I realize the issue - the file is truncated or something is wrong
// Let me verify by checking total lines vs expected

// Original had ~1181 lines
// Current has 1177 lines
// 4 lines difference suggests something was removed incorrectly

// Given the complexity, let me just write the complete fixed file content
// I'll read the current file, remove the broken getLeftSidebar section,
// and insert a clean version

console.log('\n=== Creating clean getLeftSidebar section ===');
// Create clean replacement
const cleanSection = getLeftSidebarContent.split('\n');

// Now find the bounds and replace
const newLines = [...lines];

// Remove from startLine to the end of getLeftSidebar (before export)
const sectionEnd = exportLine - 1; // The line before export

// Remove lines from startLine to sectionEnd
newLines.splice(startLine, sectionEnd - startLine + 1);

// Insert clean section at startLine
for (let i = 0; i < cleanSection.length; i++) {
  newLines.splice(startLine + i, 0, cleanSection[i]);
}

console.log('Original lines:', lines.length);
console.log('New lines:', newLines.length);

// Verify the structure around the replacement
console.log('\nVerification - lines around replacement:');
const checkStart = startLine - 2;
const checkEnd = startLine + cleanSection.length + 3;
for (let i = checkStart; i <= Math.min(checkEnd, newLines.length - 1); i++) {
  console.log((i+1) + ': ' + newLines[i]);
}

// Save
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', newLines.join('\n'), 'utf8');
console.log('\nFile saved');
console.log('New total lines:', newLines.length);

// Test build
const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED!');
} catch (e) {
  console.log('BUILD FAILED:');
  console.log(e.stdout ? e.stdout.toString().substring(0, 2000) : 'no output');
}