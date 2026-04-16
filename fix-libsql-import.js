const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Add createClient import before getDb import
const insertIdx = lines.findIndex(l => l.includes("import { getDb }"));
if (insertIdx !== -1) {
  lines.splice(insertIdx, 0, "import { createClient } from '@libsql/client';");
}

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);
console.log('Added createClient import');
console.log('Line 10:', JSON.stringify(lines[9]));