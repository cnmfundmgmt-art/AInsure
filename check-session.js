const { createClient } = require('@libsql/client');

const db = createClient({ url: 'file:data/cfp_local.db' });

(async () => {
  // Check sessions table
  const sessions = await db.execute({ sql: 'SELECT * FROM sessions LIMIT 5' });
  console.log('Active sessions:', JSON.stringify(sessions.rows, null, 2));
})();