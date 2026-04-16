/**
 * POST /api/auth/login
 * Unified login — hardcoded admin + DB-backed user auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@cfp.my';
const ADMIN_PASSWORD = 'admin123';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    // ── Hardcoded admin check ─────────────────────────────────────────────────
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'admin-hardcoded',
          email: ADMIN_EMAIL,
          role: 'admin',
          verificationStatus: 'verified',
        },
      });
      response.cookies.set('cfp_session', 'admin-hardcoded', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
      });
      response.cookies.set('cfp_role', 'admin', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
      });
      response.cookies.set('cfp_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
      });
      return response;
    }

    // ── Normal user login via DB ───────────────────────────────────────────────
    const db = getDb();
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        approvedByAdmin: user.approvedByAdmin ?? false,
      },
    });

    response.cookies.set('cfp_session', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
    });
    response.cookies.set('cfp_role', user.role, {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
    });
    if (user.verificationStatus === 'verified') {
      response.cookies.set('cfp_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err) {
    console.error('[login error]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
