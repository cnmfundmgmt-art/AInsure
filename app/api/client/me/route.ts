/**
 * GET /api/client/me
 * Returns current user + client info with avatar initial
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins don't have a client profile
  if (session.role === 'admin') {
    return NextResponse.json({ error: 'Not applicable for admin' }, { status: 400 });
  }

  const db = getDb();

  const userData = await db
    .select({
      email: users.email,
      role: users.role,
      fullName: clients.fullName,
      verificationStatus: users.verificationStatus,
    })
    .from(users)
    .leftJoin(clients, eq(users.id, clients.userId))
    .where(eq(users.id, session.userId))
    .limit(1)
    .get();

  if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const name = userData.fullName || userData.email || '';
  const avatarInitial = name.trim().charAt(0).toUpperCase();

  return NextResponse.json({
    ...userData,
    avatar_initial: avatarInitial,
  });
}