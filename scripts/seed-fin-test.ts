import { getDb } from '../lib/db/client';
import * as schema from '../lib/db/schema';
import { hashSync } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

async function seed() {
  const db = getDb();
  const email = 'finapi@test.com';
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).execute();
  if (existing.length > 0) {
    console.log('User finapi@test.com already exists');
    return;
  }
  const userId = nanoid();
  const clientId = nanoid();
  await db.insert(schema.users).values({
    id: userId,
    email,
    hashedPassword: hashSync('TestPass123', 10),
    role: 'client',
    verificationStatus: 'verified',
    createdAt: Math.floor(Date.now() / 1000),
  });
  await db.insert(schema.clients).values({
    id: clientId,
    userId,
    fullName: 'Financial Test User',
    createdAt: Math.floor(Date.now() / 1000),
  });
  console.log('Created user', email, 'clientId:', clientId);
}

seed().catch(console.error);
