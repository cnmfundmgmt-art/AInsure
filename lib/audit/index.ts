/**
 * Audit logging helper
 */
import { getDb } from '@/lib/db/client';
import { auditLogs } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

export async function logAudit(params: {
  userId: string;          // the person performing the action
  clientId: string;        // the record being acted upon
  action: string;          // approve | reject | update | create | delete | login | logout
  resource: string;        // verification | registration | client | etc.
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: params.userId,
      clientId: params.clientId,
      action: params.action,
      resource: params.resource,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress: params.ipAddress || null,
      createdAt: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    console.error('[audit log error]', err);
  }
}
