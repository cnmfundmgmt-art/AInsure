const fs = require('fs');
const filePath = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Find all arrow functions that return JSX
// Look for "return (" patterns after functions
let inFunction = false;
let funcStart = 0;
let braceCount = 0;
let parenCount = 0;
let angleCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track nested structure
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '{') braceCount++;
    else if (c === '}') braceCount--;
    else if (c === '(') parenCount++;
    else if (c === ')') parenCount--;
    else if (c === '<') angleCount++;
    else if (c === '>') angleCount--;
  }
  
  // Check for potential issues
  // 1. unclosed JSX tags
  if (angleCount < 0) {
    console.log(`Line ${i+1}: angleCount went negative: ${angleCount}, line: ${line.substring(0, 60)}`);
  }
  
  // 2. mismatched braces in JSX context
  if (braceCount < -1) {
    console.log(`Line ${i+1}: braceCount went to ${braceCount}, line: ${line.substring(0, 80)}`);
  }
}

console.log('\nFinal counts - Brace:', braceCount, 'Paren:', parenCount, 'Angle:', angleCount);

// Also look for specific problematic patterns
console.log('\n=== Looking for patterns with { inside JSX attr ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // onClick={() => something && something} patterns
  if (/\bonClick=\{/i.test(line) || /onClick=\{[\s\S]*&&[\s\S]*\}/.test(line)) {
    // Check if there's a nested {} issue
    const match = line.match(/onClick=\{([\s\S]*)\}/);
    if (match) {
      const expr = match[1];
      let depth = 0;
      for (const ch of expr) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth < 0) {
          console.log(`Line ${i+1}: onClick has unbalanced braces in: ${line.substring(0, 80)}`);
          break;
        }
      }
    }
  }
}

// Check if all < and > are matched
console.log('\n=== Checking all JSX tag balance ===');
let totalAngle = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Count only JSX angles (not comparison operators like <=, >=, !=, ===)
  // Simple heuristic: count < that is not preceded by = or ! and not followed by =
  let j = 0;
  while (j < line.length) {
    if (line[j] === '<') {
      // Check next char
      const next = line[j+1];
      if (next !== '=' && next !== '>' && !line.substring(j-2, j).match(/!/)) {
        totalAngle++;
      }
    }
    j++;
  }
}
console.log('Net angle balance (should be 0):', totalAngle);

// Let's try to compile to see the actual error
console.log('\n=== Checking for return statement issues ===');
// Look for lines that end with just a comma or no punctuation after JSX
for (let i = 900; i < 930; i++) {
  const line = lines[i];
  console.log(`${i+1}: ${line}`);
}