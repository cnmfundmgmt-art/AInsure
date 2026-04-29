import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';

function normalizeAsset(a: Record<string, unknown>) {
  return { id: a.id, assetType: a.assetType, name: a.name, value: a.value, createdAt: a.createdAt };
}

// POST /api/clients/[id]/assets - create asset
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const body = await req.json();
    const { assetType, name, value } = body;

    if (!assetType || !name || value === undefined) {
      return NextResponse.json({ error: 'assetType, name and value are required' }, { status: 400 });
    }

    const db = getDb();
    const [asset] = await db
      .insert(schema.advisorClientAssets)
      .values({
        id: nanoid(),
        advisorClientId,
        assetType,
        name,
        value,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return NextResponse.json(normalizeAsset(asset as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/clients/[id]/assets?id=xxx - update asset
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assetId = req.nextUrl.searchParams.get('id');
    if (!assetId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const body = await req.json();
    const { assetType, name, value } = body;

    const db = getDb();
    await db
      .update(schema.advisorClientAssets)
      .set({
        ...(assetType !== undefined && { assetType }),
        ...(name !== undefined && { name }),
        ...(value !== undefined && { value }),
      })
      .where(eq(schema.advisorClientAssets.id, assetId))
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/assets?id=xxx - delete asset
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assetId = req.nextUrl.searchParams.get('id');
    if (!assetId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    await db.delete(schema.advisorClientAssets).where(eq(schema.advisorClientAssets.id, assetId)).run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}