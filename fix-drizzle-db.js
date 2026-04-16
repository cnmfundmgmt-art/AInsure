const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix variable naming: db -> drizzleDb, dbLocal -> libsqlClient
// Line 18: const db = getDb(); -> const drizzleDb = getDb();
// Line 19: const dbLocal = createClient(...) -> const libsqlClient = createClient(...)
// Line 72: dbLocal.execute -> libsqlClient.execute

lines[17] = '  const drizzleDb = getDb();';
lines[18] = "  const libsqlClient = createClient({ url: process.env.DATABASE_URL || 'file:data/cfp_local.db' });";

// Now update all references to db in the file - but we need to be careful to not break the drizzle queries
// The db.execute call should use libsqlClient, but the db.select calls should use drizzleDb

// Let's check and fix line 72
const newLines = lines.map((line, i) => {
  if (line.includes('dbLocal')) {
    return line.replace('dbLocal', 'libsqlClient');
  }
  // Don't change db to drizzleDb globally - that would break the drizzle queries
  // We only changed dbLocal to libsqlClient
  return line;
});

const newContent = newLines.join('\n');
fs.writeFileSync(path, newContent);

// Now we need to change the db.select calls to use drizzleDb
// And db.execute calls to use libsqlClient
const finalContent = fs.readFileSync(path, 'utf8');
const finalLines = finalContent.split('\n');

// For the select queries, we need to change db to drizzleDb
// But we need to be selective about this
let result = '';
let inSelectQuery = false;

for (let i = 0; i < finalLines.length; i++) {
  let line = finalLines[i];
  
  // Skip the db and libsqlClient declarations
  if (line.includes('drizzleDb') || line.includes('libsqlClient')) {
    result += line + '\n';
    continue;
  }
  
  // Change db.select to drizzleDb.select and db.from to drizzleDb.from
  // But only for the SELECT queries (not db.execute)
  if (line.includes('db.select') || line.includes('db.from') || line.includes('db.innerJoin')) {
    line = line.replace(/db\./g, 'drizzleDb.');
  }
  
  // Fix any remaining db. references that should be drizzleDb
  // For db.delete, db.insert, etc.
  if ((line.includes('drizzleDb.delete') || line.includes('drizzleDb.insert') || line.includes('drizzleDb.update'))) {
    line = line.replace(/db\./g, 'drizzleDb.');
  }
  
  result += line + '\n';
}

fs.writeFileSync(path, result);
console.log('Done');

// Verify
const verify = fs.readFileSync(path, 'utf8').split('\n');
console.log('Lines 17-20:');
for (let i = 16; i <= 20; i++) console.log((i+1) + ': ' + verify[i]);
console.log('Lines 70-75:');
for (let i = 69; i <= 75; i++) console.log((i+1) + ': ' + verify[i]);