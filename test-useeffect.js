const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

// Remove the useEffect that starts at line 919
// Line 919: useEffect(() => {
// Line 920: if (clientDependents > 0 && !clientGoals) {
// Line 921: setClientGoals('Education, Family Protection');
// Line 922: }
// Line 923: }, [clientDependents]);

// Replace with a comment
const newLines = [...lines];
// Comment out the useEffect (lines 918-923)
for (let i = 918; i <= 923; i++) {
  newLines[i] = '// ' + newLines[i];
}

fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx.test4', newLines.join('\n'));

const orig = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx');
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', newLines.join('\n'));

const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED - The useEffect was the problem!');
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : e.stderr ? e.stderr.toString() : '';
  console.log('BUILD FAILED');
  console.log(out.substring(0, 2000));
} finally {
  fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', orig);
}