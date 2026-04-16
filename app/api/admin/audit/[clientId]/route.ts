/**
 * GET /api/admin/audit/:clientId — audit logs for a specific client
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const role = req.cookies.get('cfp_role')?.value;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const { clientId } = params;

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resource: auditLogs.resource,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.clientId, clientId))
    .orderBy(desc(auditLogs.createdAt))
    .all();

  // Enrich with actor email
  const enriched = await Promise.all(
    rows.map(async (row) => {
      let actorEmail = row.userId;
      if (row.userId) {
        const actor = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, row.userId))
          .get();
        if (actor) actorEmail = actor.email;
      }
      return {
        ...row,
        actorEmail,
        details: row.details ? JSON.parse(row.details) : null,
      };
    })
  );

  return NextResponse.json({ logs: enriched });
}
