/**
 * POST /api/admin/verifications/:id/reject
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, idDocuments, clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function requireAdvisor(req: NextRequest): string | null {
  const role = req.cookies.get('cfp_role')?.value;
  if (role === 'advisor' || role === 'admin') return role;
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = requireAdvisor(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const sessionId = req.cookies.get('cfp_session')?.value;
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = params.id;
  let reason = '';
  try {
    const body = await req.json();
    reason = body.reason || '';
  } catch { reason = ''; }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  try {
    await db.update(users)
      .set({ verificationStatus: 'rejected' })
      .where(eq(users.id, userId))
      .run();

    const client = await db.select({ id: clients.id })
      .from(clients).where(eq(clients.userId, userId)).get();

    if (client) {
      const idDoc = await db.select({ id: idDocuments.id })
        .from(idDocuments).where(eq(idDocuments.clientId, client.id)).get();
      if (idDoc) {
        await db.update(idDocuments)
          .set({ verificationStatus: 'rejected', verifiedBy: sessionId, verifiedAt: now })
          .where(eq(idDocuments.id, idDoc.id))
          .run();
      }
    }

    await logAudit({
      userId: sessionId,
      clientId: userId,
      action: 'reject',
      resource: 'verification',
      details: { reason },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).get();
    console.log(`[Email] Account rejected for ${user?.email}: ${reason}`);

    return NextResponse.json({ success: true, action: 'reject', userId, reason });
  } catch (err) {
    console.error('[reject error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
