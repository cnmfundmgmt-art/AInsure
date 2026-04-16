const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Add dbLocal after the db declaration
lines[17] = '  const db = getDb();';
lines.splice(18, 0, "  const dbLocal = createClient({ url: process.env.DATABASE_URL || 'file:data/cfp_local.db' });");

const newContent = lines.join('\n');
fs.writeFileSync(path, newContent);
console.log('Added dbLocal');

// Now fix the db.execute to dbLocal.execute
const newLines = newContent.split('\n');
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].includes('db.execute')) {
    newLines[i] = newLines[i].replace('db.execute', 'dbLocal.execute');
    console.log(`Line ${i+1}: fixed db.execute -> dbLocal.execute`);
  }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Done');