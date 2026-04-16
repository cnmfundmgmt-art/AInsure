/**
 * POST /api/admin/registrations/:clientId/approve
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  if (req.cookies.get('cfp_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const adminId = req.cookies.get('cfp_session')?.value || '';

  const client = await db.select().from(clients).where(eq(clients.id, params.clientId)).get();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  await db.update(users)
    .set({ verificationStatus: 'verified' })
    .where(eq(users.id, client.userId))
    .run();

  await db.update(idDocuments)
    .set({ verificationStatus: 'verified', verifiedBy: adminId, verifiedAt: now })
    .where(eq(idDocuments.clientId, params.clientId))
    .run();

  await logAudit({
    userId: adminId,
    clientId: params.clientId,
    action: 'approve',
    resource: 'registration',
    details: { clientUserId: client.userId },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true });
}