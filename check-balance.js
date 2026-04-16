const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

// Find line starts
let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

// Check brace/paren/bracket balance line by line
// Focus on the area around line 918-925

console.log('Tracing brace balance around lines 918-925...');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let lineIdx = 0; lineIdx < lineStarts.length; lineIdx++) {
  const lineStart = lineStarts[lineIdx];
  const lineEnd = lineStarts[lineIdx + 1] || bytes.length;
  
  const line = bytes.slice(lineStart, lineEnd).toString('utf8');
  
  for (let i = 0; i < line.length; i++) {
    const b = line[i];
    if (b === '{') braceCount++;
    else if (b === '}') braceCount--;
    else if (b === '(') parenCount++;
    else if (b === ')') parenCount--;
    else if (b === '[') bracketCount++;
    else if (b === ']') bracketCount--;
  }
  
  if (lineIdx >= 916 && lineIdx <= 928) {
    console.log('Line ' + (lineIdx + 1) + ': brace=' + braceCount + ', paren=' + parenCount + ', bracket=' + bracketCount + ' | ' + line.substring(0, 60));
  }
  
  if (lineIdx > 930) break;
}

console.log('\nFinal counts at line 930: brace=' + braceCount + ', paren=' + parenCount + ', bracket=' + bracketCount);

// Now let's check specifically: is there a missing } for the useEffect on line 919-923?
console.log('\n=== Checking useEffect structure ===');
// Lines 919-923:
//  useEffect(() => {
//  if (clientDependents > 0 && !clientGoals) {
//  setClientGoals('Education, Family Protection');
//  }
//  }, [clientDependents]);

// Line 919 opens: { (1 open brace)
// Line 920 opens: { (2 open braces)  
// Line 921 is content (no braces)
// Line 922 closes: } (1 open brace)
// Line 923 closes: } (0 open braces) and then ), [clientDependents]);

console.log('\nThe useEffect has TWO opens (lines 919 and 920) and TWO closes (lines 922 and 923)');
console.log('This looks balanced');

// But wait - line 919 is: useEffect(() => {
// The () has the arrow function
// So we have () => { which opens a paren for () and a brace for the function body

// Let's trace more carefully
console.log('\n=== Tracing line 919 in detail ===');
const line919 = bytes.slice(lineStarts[918], lineStarts[919]).toString('utf8');
console.log('Line 919: ' + JSON.stringify(line919));

let depth = 0;
for (let i = 0; i < line919.length; i++) {
  const c = line919[i];
  if (c === '(') { depth++; console.log('  pos ' + i + ': ( -> depth ' + depth); }
  else if (c === ')') { depth--; console.log('  pos ' + i + ': ) -> depth ' + depth); }
  else if (c === '{') { depth++; console.log('  pos ' + i + ': { -> depth ' + depth); }
  else if (c === '}') { depth--; console.log('  pos ' + i + ': } -> depth ' + depth); }
}

// Line 920: if (clientDependents > 0 && !clientGoals) {
console.log('\n=== Tracing line 920 in detail ===');
const line920 = bytes.slice(lineStarts[919], lineStarts[920]).toString('utf8');
console.log('Line 920: ' + JSON.stringify(line920));
for (let i = 0; i < line920.length; i++) {
  const c = line920[i];
  if (c === '(') { depth++; console.log('  pos ' + i + ': ( -> depth ' + depth); }
  else if (c === ')') { depth--; console.log('  pos ' + i + ': ) -> depth ' + depth); }
  else if (c === '{') { depth++; console.log('  pos ' + i + ': { -> depth ' + depth); }
  else if (c === '}') { depth--; console.log('  pos ' + i + ': } -> depth ' + depth); }
}

// Line 921: setClientGoals('Education, Family Protection');
console.log('\n=== Tracing line 921 in detail ===');
const line921Bytes = bytes.slice(lineStarts[920], lineStarts[921] - 1); // -1 to exclude \n
console.log('Line 921: ' + JSON.stringify(line921Bytes.toString('utf8')));
for (let i = 0; i < line921Bytes.length; i++) {
  const c = line921Bytes[i];
  if (c === '(') { depth++; console.log('  pos ' + i + ': ( -> depth ' + depth); }
  else if (c === ')') { depth--; console.log('  pos ' + i + ': ) -> depth ' + depth); }
  else if (c === '{') { depth++; console.log('  pos ' + i + ': { -> depth ' + depth); }
  else if (c === '}') { depth--; console.log('  pos ' + i + ': } -> depth ' + depth); }
}

// Line 922: }
console.log('\n=== Tracing line 922 in detail ===');
const line922Bytes = bytes.slice(lineStarts[921], lineStarts[922] - 1);
console.log('Line 922: ' + JSON.stringify(line922Bytes.toString('utf8')));
for (let i = 0; i < line922Bytes.length; i++) {
  const c = line922Bytes[i];
  if (c === '(') { depth++; console.log('  pos ' + i + ': ( -> depth ' + depth); }
  else if (c === ')') { depth--; console.log('  pos ' + i + ': ) -> depth ' + depth); }
  else if (c === '{') { depth++; console.log('  pos ' + i + ': { -> depth ' + depth); }
  else if (c === '}') { depth--; console.log('  pos ' + i + ': } -> depth ' + depth); }
}

// Line 923: }, [clientDependents]);
console.log('\n=== Tracing line 923 in detail ===');
const line923Bytes = bytes.slice(lineStarts[922], lineStarts[923] - 1);
console.log('Line 923: ' + JSON.stringify(line923Bytes.toString('utf8')));
for (let i = 0; i < line923Bytes.length; i++) {
  const c = line923Bytes[i];
  if (c === '(') { depth++; console.log('  pos ' + i + ': ( -> depth ' + depth); }
  else if (c === ')') { depth--; console.log('  pos ' + i + ': ) -> depth ' + depth); }
  else if (c === '{') { depth++; console.log('  pos ' + i + ': { -> depth ' + depth); }
  else if (c === '}') { depth--; console.log('  pos ' + i + ': } -> depth ' + depth); }
}

console.log('\nAfter line 923, depth = ' + depth);

// If depth is 0, the useEffect is properly balanced
// If depth is not 0, there's an imbalance somewhere