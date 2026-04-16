/**
 * Migration: add advisor fields to users table
 * Run: node scripts/migrate-add-advisor-fields.js
 */
const { createClient } = require('@libsql/client');

const client = createClient({ url: 'file:./data/cfp_local.db' });

async function migrate() {
  console.log('Running: add advisor fields to users table');

  const migrations = [
    "ALTER TABLE users ADD COLUMN approved_by_admin INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN approved_at INTEGER",
    "ALTER TABLE users ADD COLUMN rejection_reason TEXT",
    "ALTER TABLE users ADD COLUMN company_name TEXT",
    "ALTER TABLE users ADD COLUMN license_number TEXT",
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log('✓', sql.slice(0, 60));
    } catch (err) {
      if (err.message?.includes('duplicate column name')) {
        console.log('⚠ Already exists —', sql.slice(0, 50));
      } else {
        console.error('✗ Error:', err.message?.slice(0, 80));
      }
    }
  }

  // Mark existing demo@cfp.test as approved (it was already an advisor)
  try {
    await client.execute({
      sql: "UPDATE users SET approved_by_admin = 1, approved_at = ? WHERE email = 'demo@cfp.test'",
      args: [Math.floor(Date.now() / 1000)],
    });
    console.log('✓ Marked demo@cfp.test as approved');
  } catch (err) {
    console.error('✗ Could not update demo@cfp.test:', err.message?.slice(0, 80));
  }

  client.close();
  console.log('\n✅ Migration complete');
}

migrate().catch(console.error);
