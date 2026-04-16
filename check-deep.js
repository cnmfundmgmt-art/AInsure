const fs = require('fs');
const filePath = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Check for duplicate keys in map callbacks - a common JSX issue
// Look for .map with key that might be duplicated in siblings

// Look for patterns that could confuse JSX parser:
// 1. Ternary expressions with && in className that span multiple lines
// 2. Complex conditional expressions
// 3. Object/array literals in JSX attributes

console.log('\n=== Checking lines 1040-1050 (className ternary) ===');
for (let i = 1039; i <= 1050; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Also check lines 1000-1015 for the existingPolicies table
console.log('\n=== Checking lines 1000-1015 ===');
for (let i = 999; i <= 1015; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Check if there's any issue with the .map callback structure
// Specifically, look for nested .map calls that might confuse JSX
console.log('\n=== Checking for nested map issues ===');
let depth = 0;
let inMap = false;
let mapDepth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Count opening/closing of map patterns
  // .map( and the subsequent ( => or (function
  if (line.match(/\.map\s*\(/)) {
    mapDepth++;
    console.log(`Line ${i+1}: .map found, depth now ${mapDepth}: ${line.substring(0, 80)}`);
  }
  if (line.match(/\)\s*\}\s*\)/) && mapDepth > 0) {
    // potential close of map
    console.log(`Line ${i+1}: Potential map close, depth ${mapDepth}: ${line.substring(0, 80)}`);
    mapDepth--;
  }
}

// Check if the problem is something earlier
// Look for any suspicious syntax issues
console.log('\n=== Looking for potential issues ===');

// Check lines 330-360 (the welcome message case) more carefully
console.log('\n=== Lines 329-360 (welcome case) ===');
for (let i = 328; i <= 360; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}