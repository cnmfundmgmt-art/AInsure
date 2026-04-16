import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { liabilityIdSchema } from '@/lib/validations/financial';

async function getClientId(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return null;
  return session.clientId;
}

// DELETE /api/financial/liabilities/:id
export async function DELETE(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const parsed = liabilityIdSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid liability ID' }, { status: 400 });
    const result = await db.delete(schema.liabilities)
      .where(and(eq(schema.liabilities.id, parsed.data.id), eq(schema.liabilities.clientId, clientId)))
      .returning().execute();
    if (result.length === 0) return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    await logAudit({ userId: clientId, clientId: clientId, action: 'liability_delete', resource: 'financial', details: { liability_id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[financial/liabilities DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}