const fs = require('fs');
const path = 'C:\\Users\\000\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The issue might be with a line like:
// <button onClick={() => setIntakeOpen(!intakeOpen)}
// missing the closing />

// Let's look for button elements that might not be properly closed
const lines = content.split('\n');

// Specifically check lines around the leftSidebar
console.log('Lines 928-945:');
for (let i = 927; i <= 945; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Check: the button onClick handler contains < and >
// onClick={() => setIntakeOpen(!intakeOpen)}
// This is inside a JSX attribute, which is fine

// But wait - what if there's a > that's being interpreted as closing the JSX context?
// Let me look more carefully at the issue

// Actually, I wonder if the issue is with && inside JSX attributes
// Let me check line 929:
// <button onClick={() => setIntakeOpen(!intakeOpen)}
// className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-xs font-semibold text-gray-700">

// The onClick expression: () => setIntakeOpen(!intakeOpen)
// This has ! (not) which is fine
// But wait - is there a < anywhere in this line that could be confused?

// Actually, I notice something: line 929 doesn't end with />
// It ends with just >
// This is the start tag, but the content needs a closing </button>

// Let me check if the button is properly closed
console.log('\nChecking button structure around line 929-935:');
for (let i = 928; i <= 935; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// The button opens on line 929, but when does it close?
// Line 933 has </button>

// Actually, let me look for patterns where JSX might be misinterpreted
// Specifically, look for expressions like: && <something>
// where the && might cause JSX context confusion

console.log('\nLooking for && patterns followed by < in JSX:');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for conditional patterns in JSX that might confuse the parser
  if (line.includes('&&') && line.includes('<')) {
    console.log(`Line ${i+1}: ${line.substring(0, 80)}`);
  }
}

// Check the entire leftSidebar structure
console.log('\n=== Full leftSidebar content ===');
let inLeftSidebar = false;
let braceCount = 0;
let parenCount = 0;
let angleCount = 0;
let started = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (i === 924) { // Line 925 (0-indexed 924)
    console.log(`Line ${i+1} (START): ${line}`);
    started = true;
  }
  
  if (started && i < 1085) {
    // Track what we see
    if (line.includes('<button') || line.includes('<div') || line.includes('</button') || line.includes('</div')) {
      console.log(`${i+1}: ${line}`);
    }
  }
  
  if (i === 1082) { // Line 1083 (0-indexed 1082)
    console.log(`Line ${i+1} (END): ${line}`);
    break;
  }
}