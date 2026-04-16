const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix: use sql template tag properly
lines[32] = '       monthlyIncome: sql`(CASE WHEN annual_income IS NOT NULL THEN annual_income / 12 ELSE NULL END)`,';

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed');
console.log('Line 33:', JSON.stringify(lines[32]));