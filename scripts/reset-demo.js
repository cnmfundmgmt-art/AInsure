/**
 * Reset demo@cfp.test password
 * Run: node scripts/reset-demo.js
 */
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({ url: 'file:./data/cfp_local.db' });

async function reset() {
  const email = 'demo@cfp.test';
  const newPassword = 'demo1234';

  const existing = await client.execute({
    sql: "SELECT id, email, role FROM users WHERE email = ?",
    args: [email],
  });

  if (existing.rows.length === 0) {
    console.log('❌ No user found for:', email);
    client.close();
    return;
  }

  const user = existing.rows[0];
  console.log('Found user:', user.email, '| role:', user.role, '| id:', user.id);

  const hash = await bcrypt.hash(newPassword, 12);
  await client.execute({
    sql: "UPDATE users SET hashed_password = ? WHERE email = ?",
    args: [hash, email],
  });

  console.log('✅ Password reset for demo@cfp.test');
  console.log('   Email:    demo@cfp.test');
  console.log('   Password: demo1234');
  console.log('   Login at: http://localhost:3003/');

  client.close();
}

reset().catch(console.error);
