const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:./data/cfp_local.db' });

async function check() {
  try {
    const result = await client.execute({ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name='insurance_analysis_sessions'", args: [] });
    console.log('Schema:', result.rows[0]?.sql);
  } catch (e) {
    console.log('Table check failed:', e.message);
  }

  // Try insert with a test
  try {
    const now = Math.floor(Date.now() / 1000);
    await client.execute({
      sql: `INSERT INTO insurance_analysis_sessions (id, advisor_id, client_name, client_ic, annual_income, monthly_budget, analysis_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['test-id', 'current-advisor', 'Test', '', 60000, 500, '{}', now]
    });
    console.log('✅ Insert succeeded');
    await client.execute({ sql: "DELETE FROM insurance_analysis_sessions WHERE id='test-id'", args: [] });
  } catch (e) {
    console.log('❌ Insert failed:', e.message);
  }

  client.close();
}
check();