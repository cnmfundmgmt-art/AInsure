const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// 1. Add import for InsuranceSidebar after existing imports
// Find the imports section
const importLineIdx = lines.findIndex(l => l.includes("import { useState"));
if (importLineIdx !== -1) {
  lines.splice(importLineIdx, 0, "import InsuranceSidebar from './SidebarContent';");
  console.log('Added InsuranceSidebar import at line', importLineIdx + 1);
}

// 2. Replace the leftSidebar IIFE with a simple null
// Find the "const leftSidebar = (() => { return (" line
const leftSidebarIdx = lines.findIndex(l => l.includes('const leftSidebar = (() => { return'));
if (leftSidebarIdx !== -1) {
  lines[leftSidebarIdx] = ' // leftSidebar removed - now uses InsuranceSidebar component';
  console.log('Replaced leftSidebar at line', leftSidebarIdx + 1);
}

// 3. Replace {leftSidebar} usage with <InsuranceSidebar ... />
// The line 1111 should be {leftSidebar} - we need to change it to pass props
const leftSidebarUsageIdx = lines.findIndex((l, i) => i > 1100 && l.includes('{leftSidebar}'));
if (leftSidebarUsageIdx !== -1) {
  console.log('Found {leftSidebar} usage at line', leftSidebarUsageIdx + 1);
  // We need to replace with <InsuranceSidebar props />
  // But we need to know what props the InsuranceSidebar needs
  // From the original code, leftSidebar was used as: {leftSidebar}
  // Now we need to pass all the props that InsuranceSidebar expects
  
  // Actually, let me check what the original leftSidebar function took as parameters
  // Looking at the original code, the sidebar had access to:
  // clientIncome, clientAge, clientDependents, clientGoals, existingPolicies, etc.
  // These are state variables in the main component
  
  lines[leftSidebarUsageIdx] = ` <InsuranceSidebar
   clientIncome={clientIncome}
   clientAge={clientAge}
   clientDependents={clientDependents}
   clientGoals={clientGoals}
   existingPolicies={existingPolicies}
   analysisResult={analysisResult}
   analysisLoading={analysisLoading}
   sessionId={sessionId}
   onIncomeChange={setClientIncome}
   onAgeChange={setClientAge}
   onDependentsChange={setClientDependents}
   onGoalsChange={setClientGoals}
   onExistingPoliciesChange={setExistingPolicies}
   onStartAnalysis={handleStartAnalysis}
  />`;
  console.log('Replaced {leftSidebar} with InsuranceSidebar component at line', leftSidebarUsageIdx + 1);
}

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('\nVerifying:');
console.log('Lines 4-6:');
for (let i = 3; i <= 6; i++) console.log((i+1) + ': ' + newLines[i]);
console.log('\nLine 926 (leftSidebar):', JSON.stringify(newLines[925]));
console.log('\nLines 1110-1125:');
for (let i = 1109; i <= 1125; i++) console.log((i+1) + ': ' + newLines[i]);