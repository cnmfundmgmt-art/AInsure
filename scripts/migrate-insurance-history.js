/**
 * Migration: add insurance_analysis_sessions table for session history
 * Run: node scripts/migrate-insurance-history.js
 */
const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./data/cfp_local.db' });

async function migrate() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS insurance_analysis_sessions (
        id TEXT PRIMARY KEY,
        advisor_id TEXT NOT NULL,
        client_name TEXT,
        client_ic TEXT,
        annual_income REAL,
        monthly_budget REAL,
        analysis_data TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    console.log('✅ Created insurance_analysis_sessions table');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('⚠️ Table already exists');
    } else {
      console.error('Error:', err.message);
    }
  }
  client.close();
}
migrate();
