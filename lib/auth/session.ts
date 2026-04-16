import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/client';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface Session {
  userId: string;
  clientId: string;
  email?: string;
  role?: string;
}

// Hardcoded admin session ID (matches the hardcoded admin in /api/auth/login)
const HARDCODE_ADMIN_SESSION = 'admin-hardcoded';

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cfp_session')?.value;
  if (!sessionId) return null;

  // Hardcoded admin — no DB lookup needed
  if (sessionId === HARDCODE_ADMIN_SESSION) {
    return { userId: HARDCODE_ADMIN_SESSION, clientId: '', role: 'admin' };
  }

  const db = getDb();
  const client = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, sessionId)).get();
  if (!client) return null;
  return { userId: sessionId, clientId: client.id };
}

export async function verifySession(req: NextRequest): Promise<Session | null> {
  const sessionId = req.cookies.get('cfp_session')?.value;
  if (!sessionId) return null;

  // Hardcoded admin — no DB lookup needed
  if (sessionId === HARDCODE_ADMIN_SESSION) {
    return { userId: HARDCODE_ADMIN_SESSION, clientId: '', role: 'admin' };
  }

  const db = getDb();
  const client = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, sessionId)).get();
  if (!client) return null;
  return { userId: sessionId, clientId: client.id };
}

