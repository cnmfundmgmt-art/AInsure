const fs = require('fs');
const path = 'C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx';
const content = fs.readFileSync(path, 'utf8');

// Check for \r\n (Windows line endings)
const hasCRLF = content.includes('\r\n');
console.log('Has CRLF (Windows line endings):', hasCRLF);

// Check lines around the issue
const lines = content.split('\n');
console.log('\nLine 923:', JSON.stringify(lines[922]));
console.log('Line 924:', JSON.stringify(lines[923]));
console.log('Line 925:', JSON.stringify(lines[924]));

// The issue might be with CRLF causing problems for SWC
// Let me convert to LF and test
if (hasCRLF) {
  console.log('\nConverting CRLF to LF...');
  const converted = content.replace(/\r\n/g, '\n');
  fs.writeFileSync(path, converted, 'utf8');
  console.log('Converted. Verifying...');
  
  const newContent = fs.readFileSync(path, 'utf8');
  console.log('Has CRLF after conversion:', newContent.includes('\r\n'));
  console.log('Has LF:', newContent.includes('\n'));
}

// Try building
const { execSync } = require('child_process');
try {
  console.log('\nRunning build...');
  const result = execSync('npm run build 2>&1', { stdio: 'pipe', cwd: 'C:/Users/000/.openclaw/workspace/cfp-malaysia', timeout: 180000 });
  console.log('Build succeeded!');
  console.log(result.toString().substring(0, 500));
} catch (e) {
  console.log('Build failed:');
  const output = e.stdout ? e.stdout.toString() : (e.stderr ? e.stderr.toString() : 'no output');
  console.log(output.substring(0, 2000));
}