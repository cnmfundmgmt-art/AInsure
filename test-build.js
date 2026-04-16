const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

const idx = lines.findIndex(l => l.trim() === 'const leftSidebar = (');
console.log('leftSidebar at line', idx + 1, ':', lines[idx]);

// Find the end of the JSX - look for pattern "  );" that matches the opening
let endIdx = idx + 1;
let depth = 1; // We're inside the arrow function return, track nested elements
// Actually, we're just looking for a line that is exactly "  );" at depth 0 within the JSX
// The JSX structure: <div> <div> <button> ... </button> {intakeOpen && ( ... )} ... </div></div>
// We need to find where the entire leftSidebar JSX closes

// Simpler approach: find lines 1180-1185 to see what's there
console.log('\nLines 1178-1185:');
for (let i = 1177; i <= 1184; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}

// Let me just comment out the section and test
const testLines = lines.map((l, i) => {
  if (i >= idx && i <= 1185) {
    return '// ' + l;
  }
  return l;
});

fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx.test', testLines.join('\n'));
console.log('\nTest file created');

const orig = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx');
fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', testLines.join('\n'));

const { execSync } = require('child_process');
try {
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 120000 });
  console.log('BUILD SUCCEEDED!');
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : e.stderr ? e.stderr.toString() : '';
  console.log('BUILD FAILED:', out.substring(0, 2000));
} finally {
  fs.writeFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', orig);
  console.log('Restored original');
}