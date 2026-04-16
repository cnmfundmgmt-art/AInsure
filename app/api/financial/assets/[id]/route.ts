import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { assetIdSchema } from '@/lib/validations/financial';

async function getClientId(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return null;
  return session.clientId;
}

// DELETE /api/financial/assets/:id
export async function DELETE(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const parsed = assetIdSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
    const result = await db.delete(schema.assets)
      .where(and(eq(schema.assets.id, parsed.data.id), eq(schema.assets.clientId, clientId)))
      .returning().execute();
    if (result.length === 0) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    await logAudit({ userId: clientId, clientId: clientId, action: 'asset_delete', resource: 'financial', details: { asset_id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[financial/assets DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}