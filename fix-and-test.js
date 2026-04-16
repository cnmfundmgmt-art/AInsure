const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const bytes = Buffer.from(content, 'utf8');

let lineStarts = [0];
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] === 10) lineStarts.push(i + 1);
}

console.log('Lines 920-925:');
for (let i = 919; i <= 924; i++) {
  const start = lineStarts[i];
  const end = lineStarts[i + 1] || bytes.length;
  const line = bytes.slice(start, end).toString('utf8');
  console.log('Line ' + (i + 1) + ': ' + JSON.stringify(line));
}

console.log('\n=== Checking for quote issues in line 921 ===');
const line921 = bytes.slice(lineStarts[920], lineStarts[921] - 1);
console.log('Line 921 raw bytes:');
for (let i = 0; i < line921.length; i++) {
  const b = line921[i];
  console.log('  pos ' + i + ': ' + b + ' = \'' + (b >= 32 && b < 127 ? String.fromCharCode(b) : '?') + '\'');
}

console.log('\n=== Last && before line 925 ===');
let lastAndAndPos = -1;
for (let i = 0; i < lineStarts[924]; i++) {
  if (bytes[i] === 38 && bytes[i + 1] === 38) {
    lastAndAndPos = i;
  }
}
console.log('Last && at byte: ' + lastAndAndPos);
if (lastAndAndPos > 0) {
  const ctxStart = Math.max(0, lastAndAndPos - 20);
  const ctxEnd = Math.min(bytes.length, lastAndAndPos + 40);
  console.log('Context: ' + JSON.stringify(bytes.slice(ctxStart, ctxEnd).toString('utf8')));
}

console.log('\n=== Checking for unclosed strings (simple check) ===');
let inSingle = false;
let inDouble = false;
let inTemplate = false;
let i = 0;
let line = 1;
while (i < bytes.length) {
  if (bytes[i] === 10) line++;
  
  if (!inSingle && !inDouble && !inTemplate) {
    if (bytes[i] === 39) inSingle = true;
    else if (bytes[i] === 34) inDouble = true;
    else if (bytes[i] === 96) inTemplate = true;
  } else {
    if (bytes[i] === 92) { i++; } // skip escaped
    else if (inSingle && bytes[i] === 39) inSingle = false;
    else if (inDouble && bytes[i] === 34) inDouble = false;
    else if (inTemplate && bytes[i] === 96) inTemplate = false;
  }
  
  if (line > 925) break;
  i++;
}

if (inSingle) console.log('UNCLOSED single quote string');
else if (inDouble) console.log('UNCLOSED double quote string');
else if (inTemplate) console.log('UNCLOSED template literal');
else console.log('All strings properly closed');

console.log('\n=== Trying to fix by adding semicolon after useEffect ===');
// The useEffect at lines 918-923 ends with:
//   }, [clientDependents]);
// This is a proper useEffect closure
// But maybe SWC is confused by something earlier

// Let me try: add a semicolon after line 923
const lines = content.split('\n');
lines[922] = lines[922].trimEnd() + ';';
const newContent = lines.join('\n');
fs.writeFileSync(path, newContent, 'utf8');
console.log('Added semicolon after line 923');

// Test build
const { execSync } = require('child_process');
try {
  execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia' });
  console.log('Build succeeded!');
} catch (e) {
  console.log('Build failed - checking error...');
  const result = e.stdout ? e.stdout.toString() : e.stderr ? e.stderr.toString() : '';
  console.log(result.substring(0, 2000));
}