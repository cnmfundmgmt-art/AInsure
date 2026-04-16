// Try to parse the insurance page.tsx with a JS syntax checker
const fs = require('fs');

// Read with different encodings and check for BOM
const raw = fs.readFileSync('C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx');

// Check for BOM
const bom = [0xEF, 0xBB, 0xBF];
console.log('First 3 bytes:', raw.slice(0, 3).toJSON().data);
console.log('Has BOM:', raw[0] === 0xEF && raw[1] === 0xBB && raw[2] === 0xBF);

// Try to remove any problematic characters and write to a clean file
let content = raw.toString('utf8');

// Check for \r\n line endings
const crlfCount = (content.match(/\r\n/g) || []).length;
const lfCount = (content.match(/\n/g) || []).length;
console.log('CRLF lines:', crlfCount);
console.log('LF lines:', lfCount);

// Try to use SWC to parse
try {
  const { parse } = require('@swc/core');
  console.log('\nTrying SWC parse...');
} catch (e) {
  console.log('SWC not available:', e.message);
}

// Try to find specific problematic patterns
console.log('\n=== Looking for problems ===');

// 1. Check for unbalanced JSX in multi-line expressions
// 2. Check for potential string/template literal issues

// Look specifically at the ternary that spans lines 1043-1046
const lines = content.split('\n');
console.log('\nLines 1042-1048:');
for (let i = 1041; i <= 1048; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Check if there's an issue with the .map at line 1001
console.log('\nLine 1000-1004 (existingPolicies):');
for (let i = 999; i <= 1004; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// The issue might be that the multiline ternary in className creates ambiguity
// Let me look for specific patterns that break JSX

// Check for arrow functions that return JSX but don't use parentheses correctly
console.log('\n=== Checking for return JSX issues ===');
// Lines 1037-1048 show a button with a complex ternary className

// Let's try a different approach: use the typescript compiler API
try {
  const ts = require('typescript');
  const source = content;
  
  const options = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NextJS,
    jsx: ts.JsxEmit.React,
    strict: true,
  };
  
  const host = ts.createCompilerHost(options);
  const originalReadFile = host.readFile;
  host.readFile = (fileName) => {
    if (fileName.includes('page.tsx')) return source;
    return originalReadFile(fileName);
  };
  
  const program = ts.createProgram(['page.tsx'], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  
  if (diagnostics.length > 0) {
    console.log('\nTypeScript/SWC Diagnostics:');
    diagnostics.forEach(d => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      const line = d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 'unknown';
      console.log(`Line ${line}: ${msg}`);
    });
  } else {
    console.log('\nNo diagnostics from TS compiler');
  }
} catch (e) {
  console.log('TS parse error:', e.message);
}

// Let's check for the specific issue - the className template literal
// The className is: `w-full flex items-center justify-center gap-2 text-sm font-medium transition-all
// ${analysisLoading || clientIncome == null
//   ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
//   : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white'
// }`

// This should work in JSX. But maybe there's an issue with && in the expression
// causing the parser to get confused about JSX context

// Let's check if there's a missing close bracket somewhere
console.log('\n=== Checking bracket balance ===');
let braces = 0, parens = 0, brackets = 0;
let lineNum = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braces++;
  else if (content[i] === '}') braces--;
  else if (content[i] === '(') parens++;
  else if (content[i] === ')') parens--;
  else if (content[i] === '[') brackets++;
  else if (content[i] === ']') brackets--;
  
  if (content[i] === '\n') {
    lineNum++;
    if (lineNum === 923) {
      console.log(`Line 923 reached, braces=${braces}, parens=${parens}, brackets=${brackets}`);
    }
  }
}
console.log(`Final - braces:${braces}, parens:${parens}, brackets:${brackets}`);