const fs = require('fs');
const path = 'C:\\Users\\000\\.openclaw\\workspace\\cfp-malaysia\\app\\insurance\\page.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Check what's around line 925
console.log('Line 922-928:');
for (let i = 921; i <= 927; i++) {
  console.log(`${i+1} (len=${lines[i].length}): ${JSON.stringify(lines[i])}`);
}

// Check if there's any issue with the useEffect closing
// Line 923:  }, [clientDependents]);
// The issue might be that the useEffect doesn't have a semicolon or the newline
// confuses the parser

// Let's check: is the useEffect on 918-923 properly closed?
console.log('\nUseEffect check:');
console.log('Line 918:', JSON.stringify(lines[917]));
console.log('Line 919:', JSON.stringify(lines[918]));
console.log('Line 920:', JSON.stringify(lines[919]));
console.log('Line 921:', JSON.stringify(lines[920]));
console.log('Line 922:', JSON.stringify(lines[921]));
console.log('Line 923:', JSON.stringify(lines[922]));

// Check for invisible characters
console.log('\nChecking for invisible chars in lines 918-925:');
for (let i = 917; i <= 925; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const code = line.charCodeAt(j);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      console.log(`Line ${i+1}, pos ${j}: char code ${code}`);
    }
  }
}

// Let's also try a simpler check: maybe the issue is that the JSX parser 
// is treating the < in the ternary (line 1046) as starting a JSX tag
// But that shouldn't be an issue since it's inside a template literal...

// Wait - the ternary in className is NOT inside a template literal string
// It's inside a regular JSX attribute value that uses a template literal
// Let me look at it more carefully

console.log('\nLines 1040-1048 (the className):');
for (let i = 1039; i <= 1048; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Now let's try building to see if we get the same error
console.log('\n--- Checking TypeScript compilation ---');
try {
  const ts = require('typescript');
  const source = fs.readFileSync(path, 'utf8');
  
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.ESNext,
    },
    fileName: 'page.tsx',
  });
  
  console.log('Transpilation successful!');
  console.log('Output length:', result.outputText.length);
} catch (e) {
  console.log('Transpilation error:', e.message);
}