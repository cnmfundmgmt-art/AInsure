const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log('Before fix - lines 924-927:');
const lines = content.split('\n');
console.log('924:', JSON.stringify(lines[923]));
console.log('925:', JSON.stringify(lines[924]));
console.log('926:', JSON.stringify(lines[925]));
console.log('927:', JSON.stringify(lines[926]));

// Fix: Use regex that handles whitespace properly
// Pattern: 'const leftSidebar = (' followed by '<div className="space-y-3">'
const before = content;
content = content.replace(
  / const leftSidebar = \(\n +<div className="space-y-3">/,
  ' const getLeftSidebar = () => (\n<>\n<div className="space-y-3">'
);

if (content !== before) {
  console.log('Pattern 1 matched - replaced leftSidebar with getLeftSidebar + fragment');
} else {
  console.log('Pattern 1 NOT matched - trying alternate approach');
  // Try without leading space
  content = content.replace(
    /const leftSidebar = \(\n +<div className="space-y-3">/,
    'const getLeftSidebar = () => (\n<>\n<div className="space-y-3">'
  );
  if (content !== before) {
    console.log('Pattern 1b matched (no leading space)');
  }
}

// Fix 2: Change {leftSidebar} to {getLeftSidebar()}
content = content.replace('{leftSidebar}', '{getLeftSidebar()}');
console.log('After replacements, line 924:', JSON.stringify(content.split('\n')[923]));

// Now fix the closing - find where the function ends and add </>
// At end of file: lines 1178: </div>, 1179: );, 1180: }
// We need </> before );
const contentLines = content.split('\n');
// Find the ); that closes the function - it should be before the final }
const lastNonEmpty = contentLines[contentLines.length - 2]; // line 1179 is );
console.log('Last non-empty line before }:', JSON.stringify(lastNonEmpty));

if (lastNonEmpty.trim() === ');') {
  // Replace ');' with '\n</>\n);'
  content = content.replace(/\n\);\n\}$/, '\n</>\n);\n}');
  console.log('Added closing fragment');
}

fs.writeFileSync(path, content);
console.log('\nFinal check - lines 924-927:');
const finalLines = content.split('\n');
console.log('924:', JSON.stringify(finalLines[923]));
console.log('925:', JSON.stringify(finalLines[924]));
console.log('926:', JSON.stringify(finalLines[925]));
console.log('927:', JSON.stringify(finalLines[926]));
console.log('\nHas getLeftSidebar:', content.includes('getLeftSidebar'));
console.log('Has {getLeftSidebar()}:', content.includes('{getLeftSidebar()}'));
console.log('Has <>:', content.includes('<>'));