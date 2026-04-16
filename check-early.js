const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Look at what comes BEFORE line 918 (the useEffect comment area)
// The issue might be that something opened a construct that SWC considers "JSX mode"
// and when it hits <div at line 926, it's expecting JSX syntax

// Check lines 900-925 more carefully
console.log('\n=== Lines 900-925 ===');
for (let i = 899; i <= 924; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// Check if there's any stray < that opens JSX before line 925
// Look for any < that is NOT part of a closing tag </something> or self-closing />

let inString = false;
let stringChar = '';
let openTags = [];

for (let i = 0; i < 925; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    
    // Handle strings
    if (!inString && (c === '"' || c === "'" || c === '`')) {
      inString = true;
      stringChar = c;
    } else if (inString && c === stringChar && line[j-1] !== '\\') {
      inString = false;
    }
    
    // Track JSX tags only outside strings
    if (!inString) {
      if (c === '<' && line[j+1] !== '/') {
        // Opening tag
        openTags.push({ line: i+1, col: j, context: line.substring(Math.max(0,j-20), j+30) });
      } else if (c === '<' && line[j+1] === '/') {
        // Closing tag - pop
        if (openTags.length > 0) openTags.pop();
      }
    }
  }
}

console.log('\n=== Open JSX tags before line 925 ===');
openTags.forEach(t => {
  console.log('Line', t.line, 'col', t.col + ':', t.context.substring(0, 60));
});

// Also check what the last thing before line 925 is
console.log('\n=== Context around line 925 ===');
for (let i = 920; i <= 928; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// Now check: what if the issue is that SWC is confused by the template literal 
// in the template string earlier in the file?
// Let me check for any template literals that span multiple lines
console.log('\n=== Checking for multiline template strings before line 925 ===');
for (let i = 0; i < 925; i++) {
  const line = lines[i];
  // Check for incomplete template literals
  const backticks = (line.match(/`/g) || []).length;
  if (backticks % 2 === 1) {
    console.log('Odd number of backticks at line', i+1, ':', line.substring(0, 80));
  }
}