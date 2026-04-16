const { db, schema } = require('./lib/db');
const { hashSync } = require('@node-rs/argon2');
const { nanoid } = require('nanoid');

async function seed() {
  // Check if test user exists
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, 'finapi@test.com')).execute();
  if (existing.length > 0) { console.log('User exists'); return; }
  
  const userId = nanoid();
  await db.insert(schema.users).values({
    id: userId,
    email: 'finapi@test.com',
    hashedPassword: hashSync('TestPass123'),
    role: 'client',
    verificationStatus: 'verified',
    createdAt: Date.now(),
  }).execute();
  
  await db.insert(schema.clients).values({
    id: nanoid(),
    userId,
    fullName: 'Financial Test User',
    createdAt: Date.now(),
  }).execute();
  
  console.log('User created');
}

const { eq } = require('drizzle-orm');
seed().catch(console.error);
