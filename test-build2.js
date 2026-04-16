const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.trim() === 'const leftSidebar = (');
console.log('leftSidebar at line', idx + 1);

// Find end of JSX - it's the line that closes the const assignment
// Looking for "  );" at the end
let endIdx = idx + 1;
while (endIdx < lines.length) {
  const trim = lines[endIdx].trim();
  if (trim === ');' && lines[endIdx].startsWith('  ')) {
    break;
  }
  endIdx++;
}
console.log('JSX ends at line', endIdx + 1);

// Now replace the entire leftSidebar JSX with a simple null
const newLines = [];
for (let i = 0; i < idx; i++) {
  newLines.push(lines[i]);
}
// Replace with a simple null
newLines.push(' const leftSidebar = null;');
for (let i = endIdx + 1; i < lines.length; i++) {
  newLines.push(lines[i]);
}

fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx.test2', newLines.join('\n'));
console.log('Test file 2 created');

const orig = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx');
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', newLines.join('\n'));

const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED - leftSidebar JSX was the problem!');
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : e.stderr ? e.stderr.toString() : '';
  console.log('BUILD FAILED:', out.substring(0, 2000));
} finally {
  fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', orig);
  console.log('Restored original');
}