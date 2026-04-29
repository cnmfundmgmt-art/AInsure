import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';

function normalizeLiability(l: Record<string, unknown>) {
  return {
    id: l.id,
    liabilityType: l.liabilityType,
    name: l.name,
    amount: l.amount,
    interestRate: l.interestRate,
    createdAt: l.createdAt,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const body = await req.json();
    const { liabilityType, name, amount, interestRate } = body;

    if (!liabilityType || !name || amount === undefined) {
      return NextResponse.json({ error: 'liabilityType, name and amount are required' }, { status: 400 });
    }

    const db = getDb();
    const [liability] = await db
      .insert(schema.advisorClientLiabilities)
      .values({
        id: nanoid(),
        advisorClientId,
        liabilityType,
        name,
        amount,
        interestRate: interestRate ?? null,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return NextResponse.json(normalizeLiability(liability as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const liabilityId = req.nextUrl.searchParams.get('id');
    if (!liabilityId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    await db.delete(schema.advisorClientLiabilities).where(eq(schema.advisorClientLiabilities.id, liabilityId)).run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}