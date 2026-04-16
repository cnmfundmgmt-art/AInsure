const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Before fix:');
for (let i = 166; i <= 180; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));

// Fix 1: Line 168 - wrong indentation (2 spaces should be 4)
lines[167] = '   const [showDetail, setShowDetail] = useState(false);';

// Fix 2: Line 169 - wrong indentation
lines[168] = '   const [editing, setEditing] = useState(false);';

// Fix 3: Line 170 - wrong indentation and missing fullName field
lines[169] = '   const [editFields, setEditFields] = useState<Record<string, string>>({';
lines[170] = '     fullName: rec.fullName,';
lines[171] = '     icNumber: rec.icNumber || \'\',';

// Fix 4: Lines 172-176 - need proper indentation (should be 5 spaces, continuation of editFields)
lines[172] = '     gender: rec.gender || \'\',';
lines[173] = '     age: rec.age != null ? String(rec.age) : \'\',';
lines[174] = '     nationality: rec.nationality || \'\',';
lines[175] = '     address: rec.docAddress || \'\',';
lines[176] = '   });';

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

console.log('\nAfter fix:');
const newLines = newContent.split('\n');
for (let i = 166; i <= 180; i++) console.log((i+1) + ': ' + JSON.stringify(newLines[i]));