import { getDb } from '../lib/db/client';
import { users, clients } from '../lib/db/schema';
import { eq, like } from 'drizzle-orm';

async function check() {
  const db = getDb();
  const demoUsers = await db.select().from(users).where(like(users.email, '%demo%')).execute();
  console.log('Demo users:', JSON.stringify(demoUsers.map(u => ({ id: u.id, email: u.email, role: u.role, verificationStatus: u.verificationStatus })), null, 2));

  if (demoUsers.length > 0) {
    const demoUser = demoUsers[0];
    const demoClients = await db.select().from(clients).where(eq(clients.userId, demoUser.id)).execute();
    console.log('Demo clients:', JSON.stringify(demoClients, null, 2));

    if (demoClients.length === 0) {
      console.log('No client record for demo user — creating one...');
      const { nanoid } = await import('nanoid');
      await db.insert(clients).values({
        id: nanoid(),
        userId: demoUser.id,
        fullName: 'Demo User',
        createdAt: Math.floor(Date.now() / 1000),
      });
      console.log('Created client record for demo user');
    }
  }
}

check().catch(console.error);
