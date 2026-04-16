const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// The issue is on line 347 - the <button tag is on the same line as {(msg.suggestions...)map((s) => (
// Need to separate them properly

// Line 346: {(msg.suggestions !== null ? (msg.suggestions as string[]) : []).map((s) => (
// Line 347: className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-50 transition">{s}</button>
// Should be:
// Line 346: {(msg.suggestions !== null ? (msg.suggestions as string[]) : []).map((s) => (
// Line 347:   <button key={s} onClick={() => window.dispatchEvent(new CustomEvent('suggestion', { detail: s }))}
// Line 348:   className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-50 transition">{s}</button>

// Fix line 346 to add a newline after (s) => (
lines[345] = lines[345].trimEnd() + '\n    <button key={s} onClick={() => window.dispatchEvent(new CustomEvent(\'suggestion\', { detail: s }))}';
// Line 347 should just be the className attribute on the button
lines[346] = '    className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-50 transition">{s}</button>';

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 344-351:');
for (let i = 343; i <= 351; i++) console.log((i+1) + ': ' + newLines[i]);