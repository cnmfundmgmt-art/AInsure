/**
 * POST /api/admin/advisors/:id/approve
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.cookies.get('cfp_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const advisorId = params.id;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const adminId = req.cookies.get('cfp_session')?.value || '';

  await db
    .update(users)
    .set({ approvedByAdmin: true, approvedAt: now, rejectionReason: null })
    .where(eq(users.id, advisorId))
    .run();

  await logAudit({
    userId: adminId,
    clientId: advisorId,
    action: 'approve',
    resource: 'advisor_approval',
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true });
}
