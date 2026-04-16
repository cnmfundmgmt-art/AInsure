import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';
import { createSnapshotSchema } from '@/lib/validations/financial';
import { logAudit } from '@/lib/audit';

async function getClientId(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) return null;
  return session.clientId;
}

// Normalise camelCase DB rows to snake_case for frontend compatibility
function normaliseSnapshot(row: Record<string, unknown>) {
  return {
    id: row.id,
    monthly_income: row.monthlyIncome,
    monthly_expenses: row.monthlyExpenses,
    emergency_fund: row.emergencyFund,
    snapshot_date: row.snapshotDate,
    created_at: row.createdAt,
  };
}

// GET /api/financial/snapshot
// Query ?latest=true → returns most recent snapshot
export async function GET(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    if (searchParams.get('latest') === 'true') {
      const latest = await db.select().from(schema.financialSnapshots)
        .where(eq(schema.financialSnapshots.clientId, clientId))
        .orderBy(desc(schema.financialSnapshots.snapshotDate)).limit(1).execute();
      return NextResponse.json(latest[0] ? normaliseSnapshot(latest[0] as Record<string, unknown>) : null);
    }
    const rows = await db.select().from(schema.financialSnapshots)
      .where(eq(schema.financialSnapshots.clientId, clientId))
      .orderBy(desc(schema.financialSnapshots.snapshotDate)).all();
    return NextResponse.json(rows.map(r => normaliseSnapshot(r as Record<string, unknown>)));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/financial/snapshot
export async function POST(req: NextRequest) {
  try {
    const clientId = await getClientId(req);
    if (!clientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const parsed = createSnapshotSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { monthly_income, monthly_expenses, emergency_fund } = parsed.data;
    const db = getDb();
    const [snapshot] = await db.insert(schema.financialSnapshots).values({
      id: nanoid(),
      clientId,
      monthlyIncome: monthly_income,
      monthlyExpenses: monthly_expenses,
      emergencyFund: emergency_fund ?? null,
      snapshotDate: Date.now(),

    }).returning();
    await logAudit({ userId: clientId, clientId: clientId, action: 'create', resource: 'financial_snapshot', details: { snapshot_id: snapshot.id } });
    return NextResponse.json(normaliseSnapshot(snapshot as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

