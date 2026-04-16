const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

// Check line 158 (className template literal in ICScanUpload)
// The issue might be that ICScanUpload is a function component, and the JSX inside it
// might not be properly closed before the next component starts

// Find the end of ICScanUpload function
let inICScanUpload = false;
let braceDepth = 0;
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('function ICScanUpload')) {
    inICScanUpload = true;
    startLine = i;
    braceDepth = 0;
  }
  
  if (inICScanUpload) {
    for (const c of line) {
      if (c === '{') braceDepth++;
      else if (c === '}') braceDepth--;
    }
    
    if (braceDepth === 0 && i > startLine && startLine !== -1) {
      endLine = i;
      console.log('ICScanUpload function: lines', startLine + 1, 'to', endLine + 1);
      console.log('End line content:', lines[endLine]);
      break;
    }
  }
}

// Also find AssistantMessage function end
let inAssistant = false;
startLine = -1;
endLine = -1;
braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('function AssistantMessage')) {
    inAssistant = true;
    startLine = i;
    braceDepth = 0;
  }
  
  if (inAssistant) {
    for (const c of line) {
      if (c === '{') braceDepth++;
      else if (c === '}') braceDepth--;
    }
    
    if (braceDepth === 0 && i > startLine && startLine !== -1) {
      endLine = i;
      console.log('AssistantMessage function: lines', startLine + 1, 'to', endLine + 1);
      console.log('End line content:', lines[endLine]);
      break;
    }
  }
}

// Now check: what function is around line 760 (before InsurancePage)?
console.log('\n=== Lines 755-765 ===');
for (let i = 754; i <= 764; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// Check: the line before useEffect at 919 should be inside the InsurancePage function
// and it should be at brace depth 1 (inside the function body)
console.log('\n=== Checking brace depth at lines 900-925 ===');
braceDepth = 0;
let inFunc = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function InsurancePage')) {
    inFunc = true;
  }
  
  if (inFunc) {
    for (const c of lines[i]) {
      if (c === '{') braceDepth++;
      else if (c === '}') braceDepth--;
    }
    
    if (i >= 900 && i <= 925) {
      console.log('Line', i+1, ': braceDepth =', braceDepth, '|', lines[i].substring(0, 60));
    }
    
    if (i > 925) break;
  }
}

// Now look at the actual return statement of InsurancePage
// It should be around lines 1085-1090 or so
console.log('\n=== Looking for the return statement ===');
let foundReturn = false;
for (let i = 1095; i <= 1115; i++) {
  console.log((i+1) + ': ' + lines[i]);
}