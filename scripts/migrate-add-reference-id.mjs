/**
 * Migration: Add reference_id column to clients table
 * Run: node scripts/migrate-add-reference-id.mjs
 */
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

function generateReferenceId() {
  const year = new Date().getFullYear();
  const chars = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  return `CFP-${year}-${chars}`;
}

async function migrate() {
  console.log('[Migration] Connecting to:', DATABASE_URL);
  const client = createClient({ url: DATABASE_URL });

  // Check if column already exists
  try {
    await client.execute("SELECT reference_id FROM clients LIMIT 1");
    console.log('[Migration] reference_id column already exists — skipping');
    process.exit(0);
  } catch {
    // Column doesn't exist — proceed
    console.log('[Migration] Adding reference_id column via table recreation...');
  }

  // Get existing rows
  const result = await client.execute("SELECT * FROM clients");
  const rows = result.rows;
  console.log(`[Migration] Found ${rows.length} existing clients`);

  // Start transaction
  await client.execute("BEGIN TRANSACTION");

  try {
    // Create new table with reference_id
    await client.execute(`
      CREATE TABLE clients_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        reference_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        dob TEXT,
        gender TEXT,
        age INTEGER,
        ic_number TEXT UNIQUE,
        nationality TEXT,
        marital_status TEXT,
        dependents INTEGER,
        employment_status TEXT,
        annual_income REAL,
        phone_number TEXT,
        occupation TEXT,
        employer TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Insert data with generated reference IDs
    for (const row of rows) {
      const refId = generateReferenceId();
      const fields = [
        row.id, row.user_id, refId, row.full_name,
        row.dob, row.gender, row.age, row.ic_number,
        row.nationality, row.marital_status, row.dependents,
        row.employment_status, row.annual_income,
        row.phone_number, row.occupation, row.employer,
        row.created_at,
      ];
      await client.execute({
        sql: `INSERT INTO clients_new VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: fields,
      });
    }

    // Drop old table
    await client.execute("DROP TABLE clients");

    // Rename new table
    await client.execute("ALTER TABLE clients_new RENAME TO clients");

    // Create index
    await client.execute("CREATE UNIQUE INDEX idx_clients_reference_id ON clients(reference_id)");

    await client.execute("COMMIT");
    console.log(`[Migration] Done — ${rows.length} clients backfilled with reference IDs`);
  } catch (err) {
    await client.execute("ROLLBACK");
    throw err;
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error('[Migration error]', err);
  process.exit(1);
});