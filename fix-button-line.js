const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Line 347: <button ... onClick={...}
// Line 348: className="..."> (attribute on wrong line)

// Fix: combine line 347 and 348 into proper JSX
lines[346] = '       <button key={s} onClick={() => window.dispatchEvent(new CustomEvent("suggestion", { detail: s }))} className="text-xs border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-50 transition">{s}</button>';
// Remove line 347 (the stray className line)
lines.splice(347, 1);

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 344-352:');
for (let i = 343; i <= 352; i++) console.log((i+1) + ': ' + newLines[i]);