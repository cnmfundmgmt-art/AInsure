const { createClient } = require('@libsql/client');

const client = createClient({ url: 'file:./data/cfp_local.db' });

async function migrate() {
  console.log('Running schema migrations...');

  // Add age to clients (gender already exists)
  try {
    await client.execute("ALTER TABLE clients ADD COLUMN age INTEGER");
    console.log('✓ Added age to clients');
  } catch(e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ clients.age already exists');
    } else {
      console.error('✗ clients.age error:', e.message);
    }
  }

  // Add gender and age to idDocuments
  try {
    await client.execute("ALTER TABLE id_documents ADD COLUMN gender TEXT");
    console.log('✓ Added gender to id_documents');
  } catch(e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ id_documents.gender already exists');
    } else {
      console.error('✗ id_documents.gender error:', e.message);
    }
  }

  try {
    await client.execute("ALTER TABLE id_documents ADD COLUMN age INTEGER");
    console.log('✓ Added age to id_documents');
  } catch(e) {
    if (e.message.includes('duplicate column')) {
      console.log('✓ id_documents.age already exists');
    } else {
      console.error('✗ id_documents.age error:', e.message);
    }
  }

  console.log('Done.');
  client.close();
}

migrate().catch(console.error);
