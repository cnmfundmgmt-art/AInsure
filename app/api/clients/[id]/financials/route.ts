import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';

function normalizeSnapshot(s: Record<string, unknown>) {
  return {
    id: s.id,
    advisorClientId: s.advisorClientId,
    monthlyIncome: s.monthlyIncome,
    monthlyExpenses: s.monthlyExpenses,
    emergencyFund: s.emergencyFund,
    snapshotDate: s.snapshotDate,
  };
}

// GET /api/clients/[id]/financials - get all financial data for advisor client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const db = getDb();

    const [snapshots, assets, liabilities] = await Promise.all([
      db.select().from(schema.advisorClientSnapshots)
        .where(eq(schema.advisorClientSnapshots.advisorClientId, advisorClientId))
        .orderBy(desc(schema.advisorClientSnapshots.snapshotDate)).execute(),
      db.select().from(schema.advisorClientAssets)
        .where(eq(schema.advisorClientAssets.advisorClientId, advisorClientId)).execute(),
      db.select().from(schema.advisorClientLiabilities)
        .where(eq(schema.advisorClientLiabilities.advisorClientId, advisorClientId)).execute(),
    ]);

    return NextResponse.json({
      snapshots: snapshots.map(normalizeSnapshot),
      assets: assets.map((a: Record<string, unknown>) => ({
        id: a.id, assetType: a.assetType, name: a.name, value: a.value, createdAt: a.createdAt,
      })),
      liabilities: liabilities.map((l: Record<string, unknown>) => ({
        id: l.id, liabilityType: l.liabilityType, name: l.name, amount: l.amount, interestRate: l.interestRate, createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/clients/[id]/financials - create snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const body = await req.json();
    const { monthlyIncome, monthlyExpenses, emergencyFund, monthly_income, monthly_expenses } = body;

    const db = getDb();
    const [snapshot] = await db
      .insert(schema.advisorClientSnapshots)
      .values({
        id: nanoid(),
        advisorClientId,
        monthlyIncome: monthlyIncome ?? monthly_income ?? null,
        monthlyExpenses: monthlyExpenses ?? monthly_expenses ?? null,
        emergencyFund: emergencyFund ?? null,
        snapshotDate: Math.floor(Date.now() / 1000),
      })
      .returning();

    return NextResponse.json(normalizeSnapshot(snapshot as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}