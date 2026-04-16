const {createClient} = require('./node_modules/@libsql/client');

const c = createClient({url:'file:C:/Users/000/.openclaw/workspace/cfp-malaysia/data/cfp_local.db'});

async function main() {
  const userId = '7d60cdfc-aadc-46da-a0ee-0b71baf0bb4f';
  
  // Approve
  await c.execute({ sql: 'UPDATE users SET approved_by_admin = 1 WHERE id = ?', args: [userId] });
  console.log('Approved user:', userId);

  // Verify
  const r = await c.execute('SELECT id, email, role, approved_by_admin FROM users WHERE id = ?', [userId]);
  console.log('Result:', JSON.stringify(r.rows, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
