const fs = require('fs');
const path = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Check the bytes around line 925 (0-indexed 924 = empty, 925 = const leftSidebar)
// Find the byte position of line 925
let byteOffset = 0;
for (let i = 0; i < 925; i++) {
  byteOffset = content.indexOf('\n', byteOffset) + 1;
}

console.log('Line 925 starts at byte:', byteOffset);
console.log('Line 925:', JSON.stringify(lines[924]));
console.log('Line 926:', JSON.stringify(lines[925]));

// Check if there's a mismatch between what the file reports and actual content
console.log('\n=== Checking raw bytes around line 925 ===');
const bytes = Buffer.from(content, 'utf8');
for (let i = byteOffset; i < byteOffset + 100; i++) {
  const b = bytes[i];
  const char = bytes[i] >= 32 && bytes[i] < 127 ? String.fromCharCode(bytes[i]) : '.';
  console.log(`${i}: ${b} (0x${b.toString(16).padStart(2,'0')}) = '${char}'`);
}

// Let's also try to isolate the problem by creating a minimal reproduction
console.log('\n=== Creating minimal test case ===');
const testContent = `'use client';

import { useState } from 'react';

export default function Test() {
  const [x, setX] = useState(0);

  useEffect(() => {
    if (x > 0) setX(1);
  }, [x]);

  const leftSidebar = (
    <div>test</div>
  );

  return (
    <div>{leftSidebar}</div>
  );
}
`;
fs.writeFileSync('C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\test-min.jsx', testContent);
console.log('Test file created');

// Now check what SWC/Next version says
console.log('\n=== Checking Next.js version ===');
const pkg = JSON.parse(fs.readFileSync('C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\package.json', 'utf8'));
console.log('Next.js version:', pkg.dependencies?.next || pkg.devDependencies?.next);

// Check for SWC issues
console.log('\n=== SWC version ===');
const nextPkg = require('C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\node_modules\\next\\package.json');
console.log('Next.js full version:', nextPkg.version);