const fs = require('fs');
const path = 'app/api/insurance/analyze/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix: change 'return points.slice(0, 3);' to cast properly
lines[230] = '  return points.slice(0, 3) as Array<{ id: string; title: string; description: string; financialImpact: string; urgency: \'high\' | \'medium\' | \'low\' }>;';

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed line 231');
console.log('Line 231:', JSON.stringify(lines[230]));