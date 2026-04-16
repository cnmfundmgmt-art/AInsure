const fs = require('fs');
const content = fs.readFileSync('C:/Users/000/.openclaw/workspace/cfp-malaysia/app/insurance/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Check how many backticks on lines 158 and 162
console.log('Line 158 backticks:', (lines[157].match(/`/g) || []).length);
console.log('Line 159 backticks:', (lines[158].match(/`/g) || []).length);
console.log('Line 160 backticks:', (lines[159].match(/`/g) || []).length);
console.log('Line 161 backticks:', (lines[160].match(/`/g) || []).length);
console.log('Line 162 backticks:', (lines[161].match(/`/g) || []).length);
console.log('Line 163 backticks:', (lines[162].match(/`/g) || []).length);

console.log('\nLine 158:', lines[157]);
console.log('Line 159:', lines[158]);
console.log('Line 160:', lines[159]);
console.log('Line 161:', lines[160]);
console.log('Line 162:', lines[161]);
console.log('Line 163:', lines[162]);

// Count total backticks in the file
const totalBackticks = (content.match(/`/g) || []).length;
console.log('\nTotal backticks in file:', totalBackticks);
console.log('Balance:', totalBackticks % 2 === 0 ? 'EVEN (balanced)' : 'ODD (unbalanced!)');

// Also check the className template literal structure more carefully
// Lines 158-163 form the className template literal
const classNameStart = 157; // line 158 (0-indexed)
const classNameEnd = 162;   // line 163

console.log('\n=== className template literal ===');
for (let i = classNameStart; i <= classNameEnd; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

// Check: is there an extra ` somewhere causing an issue?
// The structure is: className={`...${...} ${...} `}>
// Looking at lines 159-161, the expressions contain ternary ? ... : ...
// But these are inside the ${}, so they shouldn't cause issues.

// Let me check: does the className={` ... `} have 2 backticks (open and close)?
// line 158: className={`  <- 1 backtick
// line 163: `}>       <- 1 backtick
// So it IS balanced! But my script said line 162 has odd... let me recheck

console.log('\n=== Raw check of each line ===');
for (let i = 157; i <= 162; i++) {
  const line = lines[i];
  const backticks = line.split('').filter(c => c === '`').join('');
  console.log('Line', i+1, ': backtick count =', backticks.length, ':', JSON.stringify(line));
}

// Maybe the issue is elsewhere. Let me look for any suspicious character in the range 50000-51000 bytes
console.log('\n=== Checking bytes 50000-51000 ===');
const bytes = Buffer.from(content, 'utf8');
for (let i = 50000; i < 51000; i++) {
  const b = bytes[i];
  // Check for any problematic bytes
  if (b < 32 && b !== 10 && b !== 13 && b !== 9) {
    console.log('Byte', i, ':', b, '=', JSON.stringify(String.fromCharCode(bytes[i-5] || 0) + String.fromCharCode(bytes[i]) + String.fromCharCode(bytes[i+1] || 0)));
  }
}

// What about UTF-8 BOM or other markers?
console.log('\nFirst 10 bytes:', bytes.slice(0, 10).toJSON().data);

// Let me check: what if the issue is specifically with the 929-931 lines?
// <button onClick={() => setIntakeOpen(!intakeOpen)}
// className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-xs font-semibold text-gray-700">
// <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Client Intake</span>

console.log('\n=== Lines 929-932 ===');
for (let i = 928; i <= 932; i++) {
  console.log((i+1) + ':', JSON.stringify(lines[i]));
}