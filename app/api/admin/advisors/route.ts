/**
 * GET /api/admin/advisors — list advisor applications
 * Query params: status=pending|approved|rejected
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, or, isNull, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.cookies.get('cfp_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'pending';

  const base = [eq(users.role, 'advisor')];

  let rows;
  if (filter === 'approved') {
    rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        approvedByAdmin: users.approvedByAdmin,
        approvedAt: users.approvedAt,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...base, eq(users.approvedByAdmin, true)))
      .all();
  } else if (filter === 'rejected') {
    rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        approvedByAdmin: users.approvedByAdmin,
        approvedAt: users.approvedAt,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...base, eq(users.approvedByAdmin, false), isNotNull(users.rejectionReason)))
      .all();
  } else {
    // pending
    rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        approvedByAdmin: users.approvedByAdmin,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...base, eq(users.approvedByAdmin, false), isNull(users.rejectionReason)))
      .all();
  }

  return NextResponse.json({ advisors: rows });
}
