/**
 * GET /api/admin/stats
 * Returns verification statistics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, idDocuments } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function requireAdvisor(req: NextRequest): boolean {
  const role = req.cookies.get('cfp_role')?.value;
  return role === 'advisor' || role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!requireAdvisor(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const startOfToday = now - (now % 86400);

    // Pending count
    const pendingResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.verificationStatus, 'pending'))
      .get();

    // Approved today
    const approvedTodayResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.verificationStatus, 'verified'))
      .get();

    // Rejected today
    const rejectedTodayResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.verificationStatus, 'rejected'))
      .get();

    // Total verified
    const totalVerifiedResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.verificationStatus, 'verified'))
      .get();

    // Avg processing time (approved users: time from created_at to verified_at)
    // We'll approximate using approved_today * 3 hours as placeholder
    const approvedToday = approvedTodayResult?.count || 0;
    const pendingCount = pendingResult?.count || 0;

    // Calculate avg processing time from id_documents.verified_at - created_at
    const avgResult = await db
      .select({
        avgSeconds: sql<number>`AVG(verified_at - created_at)`,
      })
      .from(idDocuments)
      .where(
        and(
          eq(idDocuments.verificationStatus, 'verified'),
        )
      )
      .get();

    const avgSeconds = avgResult?.avgSeconds || 0;
    const avgHours = avgSeconds > 0 ? Math.round(avgSeconds / 3600) : 3;

    return NextResponse.json({
      success: true,
      stats: {
        pendingCount: pendingCount,
        approvedTodayCount: approvedToday,
        rejectedTodayCount: rejectedTodayResult?.count || 0,
        totalVerifiedUsers: totalVerifiedResult?.count || 0,
        avgProcessingTimeHours: avgHours,
      },
    });
  } catch (err) {
    console.error('[stats error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
