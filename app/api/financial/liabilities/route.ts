import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';
import { createLiabilitySchema } from '@/lib/validations/financial';
import { logAudit } from '@/lib/audit';

async function getClientId(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return null;
  return session.clientId;
}

function normaliseLiability(l: Record<string, unknown>) {
  return {
    id: l.id,
    liability_type: l.liabilityType,
    name: l.name,
    amount: l.amount,
    interest_rate: l.interestRate,
    created_at: l.createdAt,
  };
}

// GET /api/financial/liabilities
export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const rows = await db.select().from(schema.liabilities)
      .where(eq(schema.liabilities.clientId, clientId))
      .orderBy(schema.liabilities.createdAt).execute();
    return NextResponse.json(rows.map(normaliseLiability));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/financial/liabilities
export async function POST(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const parsed = createLiabilitySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { liability_type, name, amount, interest_rate } = parsed.data;
    const db = getDb();
    const [liability] = await db.insert(schema.liabilities).values({
      id: nanoid(),
      clientId,
      liabilityType: liability_type,
      name,
      amount,
      interestRate: interest_rate ?? null,
      createdAt: Math.floor(Date.now() / 1000),
    }).returning();
    await logAudit({ userId: clientId, clientId: clientId, action: 'create', resource: 'financial_liability', details: { liability_id: liability.id, liability_type, name, amount } });
    return NextResponse.json(normaliseLiability(liability as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/financial/liabilities?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const db = getDb();
    const [deleted] = await db.delete(schema.liabilities).where(eq(schema.liabilities.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    await logAudit({ userId: clientId, clientId: clientId, action: 'delete', resource: 'financial_liability', details: { liability_id: id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

