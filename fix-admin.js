const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix line 168 - insert showDetail state after the tab state line
// Current line 167: const [tab, setTab] = useState<'info' | 'documents' | 'activity'>('info');
// Current line 168: const [editing, setEditing] = useState(false);
// We need to insert: const [showDetail, setShowDetail] = useState(false);

// Replace line 168 with two lines
lines[167] = ' const [tab, setTab] = useState<\'info\' | \'documents\' | \'activity\'>(\'info\');';
lines.splice(168, 0, ' const [showDetail, setShowDetail] = useState(false);');
// Note: splicing shifts indices, so the old 168 becomes 169, etc.

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);
console.log('Fixed');

// Verify
const newLines = newContent.split('\n');
console.log('Line 167:', JSON.stringify(newLines[166]));
console.log('Line 168:', JSON.stringify(newLines[167]));
console.log('Line 169:', JSON.stringify(newLines[168]));
console.log('Line 170:', JSON.stringify(newLines[169]));