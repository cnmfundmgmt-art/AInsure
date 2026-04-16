/**
 * Seed default admin user
 * Run: node seed-admin.js
 */
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

const client = createClient({ url: 'file:./data/cfp_local.db' });

async function seed() {
  console.log('Seeding admin user...');

  // Check if admin already exists
  const existing = await client.execute(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  ).catch(() => ({ rows: [] }));

  if (existing.rows.length > 0) {
    console.log('✓ Admin already exists:', existing.rows[0].id);
    console.log('  Email: admin@cfp.my  Password: admin123');
    client.close();
    return;
  }

  const hash = await bcrypt.hash('admin123', 12);
  const now = Math.floor(Date.now() / 1000);

  await client.execute({
    sql: `INSERT INTO users (id, email, hashed_password, role, verification_status, created_at)
          VALUES (lower(hex(randomblob(16))), 'admin@cfp.my', ?, 'admin', 'verified', ?)`,
    args: [hash, now],
  });

  console.log('✓ Admin created successfully!');
  console.log('  Email:    admin@cfp.my');
  console.log('  Password: admin123');
  console.log('');
  console.log('Login at: http://localhost:3003/admin/login');

  client.close();
}

seed().catch(console.error);
