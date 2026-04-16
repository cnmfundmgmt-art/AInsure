/**
 * POST /api/admin/advisors/:id/reject
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
  const adminId = req.cookies.get('cfp_session')?.value || '';

  let body: { reason?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  await db
    .update(users)
    .set({ rejectionReason: body.reason || 'Application rejected', approvedByAdmin: false, approvedAt: null })
    .where(eq(users.id, advisorId))
    .run();

  await logAudit({
    userId: adminId,
    clientId: advisorId,
    action: 'reject',
    resource: 'advisor_approval',
    details: { reason: body.reason || null },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true });
}
