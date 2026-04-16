const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const newLines = lines.map(line => {
  // Skip the variable declarations
  if (line.includes('drizzleDb =') || line.includes('libsqlClient =')) {
    return line;
  }
  // Replace 'await db' or 'db.' with drizzleDb variants
  // But NOT 'libsqlClient' - that's a different variable
  if (line.includes('await db') && !line.includes('await drizzleDb')) {
    line = line.replace(/await db/g, 'await drizzleDb');
  }
  if (line.includes('db.') && !line.includes('drizzleDb.') && !line.includes('libsqlClient.')) {
    line = line.replace(/db\./g, 'drizzleDb.');
  }
  return line;
});
const newContent = newLines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const verify = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 17-22:');
for (let i = 16; i <= 22; i++) console.log((i+1) + ': ' + verify[i]);
console.log('Lines 70-74:');
for (let i = 69; i <= 74; i++) console.log((i+1) + ': ' + verify[i]);