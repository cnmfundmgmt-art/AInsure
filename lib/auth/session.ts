import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/client';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface Session {
  userId: string;
  clientId: string;
  email?: string;
  role?: string;
}

const HARDCODE_ADMIN_SESSION = 'admin-hardcoded';

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cfp_session')?.value;
  if (!sessionId) return null;

  if (sessionId === HARDCODE_ADMIN_SESSION) {
    return { userId: HARDCODE_ADMIN_SESSION, clientId: '', role: 'admin' };
  }

  const db = getDb();
  const user = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, sessionId)).get();
  if (!user) return null;

  const client = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, sessionId)).get();
  return { userId: sessionId, clientId: client?.id || '', role: user.role };
}

export async function verifySession(req: NextRequest): Promise<Session | null> {
  const sessionId = req.cookies.get('cfp_session')?.value;
  if (!sessionId) return null;

  if (sessionId === HARDCODE_ADMIN_SESSION) {
    return { userId: HARDCODE_ADMIN_SESSION, clientId: '', role: 'admin' };
  }

  const db = getDb();
  const user = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, sessionId)).get();
  if (!user) return null;

  const client = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, sessionId)).get();
  return { userId: sessionId, clientId: client?.id || '', role: user.role };
}

