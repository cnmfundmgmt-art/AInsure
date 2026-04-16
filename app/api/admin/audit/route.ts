/**
 * GET /api/admin/audit — list audit logs
 * Query params:
 *   resource=registration|verification|admin_session|...
 *   action=approve|reject|update|login|logout|...
 *   page, limit, search
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { auditLogs, users, clients } from '@/lib/db/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const role = req.cookies.get('cfp_role')?.value;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource') || '';
  const action = searchParams.get('action') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (resource) conditions.push(eq(auditLogs.resource, resource));
  if (action) conditions.push(eq(auditLogs.action, action));

  const totalRow = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .get();

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      clientId: auditLogs.clientId,
      action: auditLogs.action,
      resource: auditLogs.resource,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Enrich with actor email and client name
  const enriched = await Promise.all(
    rows.map(async (row) => {
      let actorEmail = row.userId;
      let clientName = '';

      if (row.userId) {
        const actor = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, row.userId))
          .get();
        if (actor) actorEmail = actor.email;
      }

      if (row.clientId) {
        const client = await db
          .select({ fullName: clients.fullName })
          .from(clients)
          .where(eq(clients.id, row.clientId))
          .get();
        if (client) clientName = client.fullName;
      }

      return {
        ...row,
        actorEmail,
        clientName,
        details: row.details ? JSON.parse(row.details) : null,
      };
    })
  );

  return NextResponse.json({
    logs: enriched,
    pagination: {
      page,
      limit,
      total: totalRow?.count || 0,
      pages: Math.ceil((totalRow?.count || 0) / limit),
    },
  });
}
