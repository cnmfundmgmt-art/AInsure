const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Add sql to the drizzle import
lines[7] = "import { eq, sql } from 'drizzle-orm';";

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed sql import');
console.log('Line 8:', JSON.stringify(lines[7]));