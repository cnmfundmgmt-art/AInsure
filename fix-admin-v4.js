const fs = require('fs');
const path = 'app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Current state (broken):
// 165: function DetailModal...
// 166: const queryClient...
// 167: const [tab, setTab] = useState<...>('info');  <- CORRECT
// 168:  const [tab, setTab] = useState<...>('info');  <- DUPLICATE (wrong indentation)
// 169:  const [showDetail, setShowDetail] = useState(false);  <- WRONG indentation
// 170:  const [editing, setEditing] = useState(false);  <- WRONG indentation, also wrong placement
// 171:     dob: rec.dob || '',   <- BROKEN - this should be inside editFields initializer
// ...
// 176:   });  <- stray closing

// FIX PLAN:
// 1. Remove line 168 (duplicate tab state)
// 2. Keep showDetail state (line 169 after splice)
// 3. Keep editing state (line 170 after splice)  
// 4. Fix editFields - need to reconstruct it properly

// After removing line 168:
// 167: tab state
// 168: showDetail (was 169)
// 169: editing (was 170)
// 170: dob: rec.dob... <- BROKEN

// We need line 170 to be: const [editFields, setEditFields] = useState<Record<string, string>>({
// And then fullName should be before dob

console.log('Before fix - lines 165-185:');
for (let i = 164; i <= 184; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));

// Step 1: Remove the duplicate line 168 (0-indexed: 167)
lines.splice(167, 1);

// Now line 167: tab, 168: showDetail, 169: editing, 170: dob (broken)

// Step 2: Fix line 169 (editFields initializer) - should be:
// const [editFields, setEditFields] = useState<Record<string, string>>({
//   fullName: rec.fullName,
//   icNumber: rec.icNumber || '',
//   dob: rec.dob || '',
//   ...

lines[169] = ' const [editFields, setEditFields] = useState<Record<string, string>>({';
lines.splice(170, 0, '   fullName: rec.fullName,');
lines.splice(171, 0, '   icNumber: rec.icNumber || \'\',');

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

console.log('\nAfter fix - lines 165-185:');
const newLines = newContent.split('\n');
for (let i = 164; i <= 184; i++) console.log((i+1) + ': ' + JSON.stringify(newLines[i]));