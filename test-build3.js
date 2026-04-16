const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.trim() === 'const leftSidebar = (');
console.log('leftSidebar at line', idx + 1);

// Find the end of the JSX block
let endIdx = idx + 1;
while (endIdx < lines.length) {
  const trim = lines[endIdx].trim();
  if (trim === ');' && lines[endIdx].startsWith('  ')) {
    break;
  }
  endIdx++;
}
console.log('JSX ends at line', endIdx + 1);

// Comment out only the leftSidebar line (925) itself
const newLines = [...lines];
// Replace line 925 with a commented version that doesn't use JSX
newLines[idx] = '// const leftSidebar = null; // removed for debug';

// If build passes, the issue is with how SWC parses the JSX after this line
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx.test3', newLines.join('\n'));

const orig = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx');
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', newLines.join('\n'));

const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED - Issue is on line 925 itself!');
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : e.stderr ? e.stderr.toString() : '';
  console.log('BUILD FAILED');
  // Extract just the error position
  const match = out.match(/C:\\.*\[([0-9]+):[0-9]+\]/);
  if (match) console.log('Error at line:', match[1]);
  console.log(out.substring(0, 1500));
} finally {
  fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', orig);
}