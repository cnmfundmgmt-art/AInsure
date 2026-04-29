const { createClient } = require('@libsql/client');

const c = createClient({ url: 'file:data/cfp_local.db' });

c.execute({
  sql: `ALTER TABLE advisor_clients ADD COLUMN gender text`
}).then(() => console.log('done')).catch(e => console.error(e));