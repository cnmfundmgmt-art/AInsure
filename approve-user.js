const {createClient} = require('./node_modules/@libsql/client');

const c = createClient({url:'file:data/cfp_local.db'});

async function main() {
  // Find user
  const users = await c.execute('SELECT id, email, role, approved_by_admin FROM users WHERE email = "abd@gmail.com"');
  console.log('Users found:', JSON.stringify(users.rows, null, 2));

  if (users.rows.length === 0) {
    console.log('No user found with email abd@gmail.com');
    return;
  }

  const userId = users.rows[0].id;

  // Approve the user
  await c.execute({ sql: 'UPDATE users SET approved_by_admin = 1 WHERE id = ?', args: [userId] });
  console.log('User approved successfully:', userId);

  // Verify
  const updated = await c.execute('SELECT id, email, role, approved_by_admin FROM users WHERE email = "abd@gmail.com"');
  console.log('Updated user:', JSON.stringify(updated.rows, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
