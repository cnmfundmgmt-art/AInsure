const fs = require('fs');
const path = 'app/api/insurance/clients/[id]/profile/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace db. with drizzleDb. for drizzle queries (select/from/where/innerJoin)
// But keep dbLocal as is for libsql client

const lines = content.split('\n');
const newLines = lines.map(line => {
  // Skip lines that are the variable declarations
  if (line.includes('drizzleDb =') || line.includes('libsqlClient =')) {
    return line;
  }
  // Replace db.select, db.from, db.where, db.innerJoin, etc. with drizzleDb.*
  if (line.match(/\s+db\./)) {
    return line.replace(/db\./g, 'drizzleDb.');
  }
  return line;
});

const newContent = newLines.join('\n');
fs.writeFileSync(path, newContent);

// Verify
const verify = fs.readFileSync(path, 'utf8').split('\n');
console.log('Line 17:', verify[16]);
console.log('Line 21:', verify[20]);
console.log('Line 43:', verify[42]);
console.log('Line 72:', verify[71]);