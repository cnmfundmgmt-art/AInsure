import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';
import { createAssetSchema } from '@/lib/validations/financial';
import { logAudit } from '@/lib/audit';

async function getClientId(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return null;
  return session.clientId;
}

function normaliseAsset(a: Record<string, unknown>) {
  return { id: a.id, asset_type: a.assetType, name: a.name, value: a.value, created_at: a.createdAt };
}

// GET /api/financial/assets
export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const rows = await db.select().from(schema.assets).where(eq(schema.assets.clientId, clientId)).orderBy(schema.assets.createdAt).execute();
    return NextResponse.json(rows.map(normaliseAsset));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/financial/assets
export async function POST(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { asset_type, name, value } = parsed.data;
    const db = getDb();
    const [asset] = await db.insert(schema.assets).values({
      id: nanoid(),
      clientId,
      assetType: asset_type,
      name,
      value,
      createdAt: Math.floor(Date.now() / 1000),
    }).returning();
    await logAudit({ userId: clientId, clientId: clientId, action: 'create', resource: 'financial_asset', details: { asset_id: asset.id, asset_type, name, value } });
    return NextResponse.json(normaliseAsset(asset as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/financial/assets?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const db = getDb();
    const [deleted] = await db.delete(schema.assets).where(eq(schema.assets.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    await logAudit({ userId: clientId, clientId: clientId, action: 'delete', resource: 'financial_asset', details: { asset_id: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

