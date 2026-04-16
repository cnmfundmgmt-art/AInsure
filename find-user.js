const {createClient} = require('./node_modules/@libsql/client');

const c = createClient({url:'file:C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db'});

async function main() {
  const users = await c.execute('SELECT id, email, role, approved_by_admin FROM users');
  console.log('All users:', JSON.stringify(users.rows, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
