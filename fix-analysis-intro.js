const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Line 353 should be: case 'analysis_intro': return (
// Currently it's: ; case 'analysis_intro': return (
lines[353] = " case 'analysis_intro': return (";

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const newLines = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 350-360:');
for (let i = 349; i <= 360; i++) console.log((i+1) + ': ' + newLines[i]);