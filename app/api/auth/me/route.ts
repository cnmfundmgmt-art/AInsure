/**
 * GET /api/auth/me
 * Returns current authenticated user with verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const HARDCODE_ADMIN_SESSION = 'admin-hardcoded';
const ADMIN_EMAIL = 'admin@cfp.my';

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('cfp_session')?.value;

  if (!sessionId) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Hardcoded admin — not in DB, return directly
  if (sessionId === HARDCODE_ADMIN_SESSION) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: HARDCODE_ADMIN_SESSION,
        email: ADMIN_EMAIL,
        role: 'admin',
        verificationStatus: 'verified',
      },
    });
  }

  // Regular user — DB lookup
  const db = getDb();
  const user = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    verificationStatus: users.verificationStatus,
    approvedByAdmin: users.approvedByAdmin,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, sessionId)).get();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      approvedByAdmin: user.approvedByAdmin ?? false,
    },
  });
}
