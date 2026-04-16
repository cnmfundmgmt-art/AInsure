const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Current state around lines 165-175:');
for (let i = 164; i <= 175; i++) console.log((i+1) + ': ' + lines[i]);

// The problem is that after my edits, the file has:
// 167: const [tab, setTab] = useState<...>('info');
// 168:  const [showDetail, setShowDetail] = useState(false);  <- has leading space and missing newline after ;
// 169:     fullName: rec.fullName,   <- this is broken, out of context

// Fix: line 168 should be a proper useState declaration, and line 169 onwards should be the editFields initializer
// Current lines 167-169 need to be:
// 167: const [tab, setTab] = useState<'info' | 'documents' | 'activity'>('info');
// 168: const [showDetail, setShowDetail] = useState(false);
// 169: const [editFields, setEditFields] = useState<Record<string, string>>({
// 170:   fullName: rec.fullName,

lines[167] = ' const [tab, setTab] = useState<\'info\' | \'documents\' | \'activity\'>(\'info\');';
lines[168] = ' const [showDetail, setShowDetail] = useState(false);';
lines[169] = ' const [editFields, setEditFields] = useState<Record<string, string>>({';

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

console.log('\nAfter fix:');
const newLines = newContent.split('\n');
for (let i = 164; i <= 175; i++) console.log((i+1) + ': ' + newLines[i]);

// Now check line 206 (handleSaveEdit) for setShowDetail
console.log('\nLine 206 area:');
for (let i = 203; i <= 210; i++) console.log((i+1) + ': ' + newLines[i]);