const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// The issue: editing state is missing
// Line 167: tab state
// Line 168: showDetail state (my addition)
// Line 169: editFields state - but editing should be between tab and editFields

// Fix: insert [editing, setEditing] = useState(false) after showDetail
lines[167] = ' const [tab, setTab] = useState<\'info\' | \'documents\' | \'activity\'>(\'info\');';
lines[168] = ' const [showDetail, setShowDetail] = useState(false);';
lines.splice(169, 0, ' const [editing, setEditing] = useState(false);');

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = newContent.split('\n');
console.log('Lines 167-172:');
for (let i = 166; i <= 172; i++) console.log((i+1) + ': ' + newLines[i]);