const fs = require('fs');
const path = 'app/insurance/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Show lines 920-935 and lines 1055-1080 to understand the structure
console.log('=== lines 920-940 ===');
for (let i = 919; i <= 939; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));
console.log('\n=== lines 1050-1080 ===');
for (let i = 1049; i <= 1079; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));
console.log('\n=== lines 1170-1182 ===');
for (let i = 1169; i <= 1181; i++) console.log((i+1) + ': ' + JSON.stringify(lines[i]));