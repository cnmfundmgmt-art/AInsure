/**
 * Migration: add monthly_budget to clients + client_policies table + seed policies
 * Run: node scripts/migrate-insurance-policies.js
 */
const { createClient } = require('@libsql/client');

const client = createClient({ url: 'file:./data/cfp_local.db' });

const migrations = [
  "ALTER TABLE clients ADD COLUMN monthly_budget REAL",
  `CREATE TABLE IF NOT EXISTS client_policies (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    provider TEXT,
    policy_name TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    annual_premium REAL NOT NULL,
    sum_assured REAL NOT NULL,
    ci_cover REAL DEFAULT 0,
    medical_cover REAL DEFAULT 0,
    life_cover REAL DEFAULT 0,
    policy_start_date TEXT,
    status TEXT DEFAULT 'active',
    created_at INTEGER NOT NULL
  )`,
];

async function migrate() {
  console.log('Running: add monthly_budget + client_policies table');

  // Add monthly_budget column
  try {
    await client.execute(migrations[0]);
    console.log('✓ Added monthly_budget to clients');
  } catch (err) {
    if (err.message?.includes('duplicate')) {
      console.log('⚠ monthly_budget already exists');
    } else {
      console.error('✗ Error:', err.message?.slice(0, 100));
    }
  }

  // Create client_policies table
  try {
    await client.execute(migrations[1]);
    console.log('✓ Created client_policies table');
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('⚠ client_policies already exists');
    } else {
      console.error('✗ Error:', err.message?.slice(0, 100));
    }
  }

  // Get demo clients to seed policies for
  const clients = await client.execute(`
    SELECT c.id, c.annual_income, c.age, c.full_name
    FROM clients c
    INNER JOIN users u ON c.user_id = u.id
    WHERE c.annual_income IS NOT NULL AND c.annual_income > 0
    LIMIT 5
  `);

  if (clients.rows.length === 0) {
    console.log('No clients with income found — skipping policy seed');
    client.close();
    return;
  }

  // Seed policies for demo clients
  const now = Math.floor(Date.now() / 1000);
  const policyTemplates = [
    { provider: 'AIA Malaysia', policy_name: 'AIA Term Life 100', policy_type: 'life', annual_premium: 1200, sum_assured: 300000, ci_cover: 0, medical_cover: 0, life_cover: 300000 },
    { provider: 'Great Eastern', policy_name: 'GE Medical Shield', policy_type: 'medical', annual_premium: 2400, sum_assured: 500000, ci_cover: 0, medical_cover: 500000, life_cover: 0 },
    { provider: 'Prudential', policy_name: 'PRU Critical Cover', policy_type: 'critical_illness', annual_premium: 1800, sum_assured: 200000, ci_cover: 200000, medical_cover: 0, life_cover: 0 },
    { provider: 'Allianz', policy_name: 'Allianz Life Protect', policy_type: 'life', annual_premium: 960, sum_assured: 500000, ci_cover: 100000, medical_cover: 0, life_cover: 500000 },
    { provider: 'Zurich', policy_name: 'Zurich Medicare Plus', policy_type: 'medical', annual_premium: 3000, sum_assured: 1000000, ci_cover: 0, medical_cover: 1000000, life_cover: 0 },
  ];

  let count = 0;
  for (const row of clients.rows) {
    const numPolicies = Math.floor(Math.random() * 3) + 1; // 1-3 policies
    const selected = policyTemplates.slice(0, numPolicies);
    for (const t of selected) {
      try {
        await client.execute({
          sql: `INSERT INTO client_policies (id, client_id, provider, policy_name, policy_type, annual_premium, sum_assured, ci_cover, medical_cover, life_cover, policy_start_date, status, created_at)
                VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            row.id, t.provider, t.policy_name, t.policy_type,
            t.annual_premium, t.sum_assured, t.ci_cover, t.medical_cover, t.life_cover,
            '2020-01-15', 'active', now,
          ],
        });
        count++;
      } catch (err) {
        // Ignore duplicates
      }
    }
  }

  console.log(`✅ Seeded ${count} sample policies for ${clients.rows.length} clients`);
  client.close();
}

migrate().catch(console.error);
