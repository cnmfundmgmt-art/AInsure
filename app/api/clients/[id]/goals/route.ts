import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';

function normalizeGoal(g: Record<string, unknown>) {
  return {
    id: g.id,
    advisorClientId: g.advisorClientId,
    goalType: g.goalType,
    goalName: g.goalName,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    targetYear: g.targetYear,
    priority: g.priority,
    notes: g.notes,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

// GET /api/clients/[id]/goals - get goals for a specific advisor client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const db = getDb();

    const goals = await db
      .select()
      .from(schema.advisorClientGoals)
      .where(eq(schema.advisorClientGoals.advisorClientId, advisorClientId))
      .orderBy(schema.advisorClientGoals.priority)
      .execute();

    return NextResponse.json(goals.map(normalizeGoal));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/clients/[id]/goals - create goal for advisor client
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advisorClientId = params.id;
    const body = await req.json();
    const { goalType, goalName, targetAmount, currentAmount = 0, targetYear, priority = 1, notes } = body;

    if (!goalType || !goalName || !targetAmount) {
      return NextResponse.json({ error: 'goalType, goalName and targetAmount are required' }, { status: 400 });
    }

    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const [goal] = await db
      .insert(schema.advisorClientGoals)
      .values({
        id: nanoid(),
        advisorClientId,
        goalType,
        goalName,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetYear: targetYear || null,
        priority: priority || 1,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(normalizeGoal(goal as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/clients/[id]/goals - update goal
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goalId = params.id;
    const body = await req.json();
    const { goalType, goalName, targetAmount, currentAmount, targetYear, priority, notes } = body;

    const db = getDb();
    await db
      .update(schema.advisorClientGoals)
      .set({
        ...(goalType !== undefined && { goalType }),
        ...(goalName !== undefined && { goalName }),
        ...(targetAmount !== undefined && { targetAmount }),
        ...(currentAmount !== undefined && { currentAmount }),
        ...(targetYear !== undefined && { targetYear }),
        ...(priority !== undefined && { priority }),
        ...(notes !== undefined && { notes }),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(schema.advisorClientGoals.id, goalId))
      .run();

    const updated = await db
      .select()
      .from(schema.advisorClientGoals)
      .where(eq(schema.advisorClientGoals.id, goalId))
      .get();

    return NextResponse.json(normalizeGoal(updated as Record<string, unknown>));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/goals?id=xxx - delete goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const goalId = req.nextUrl.searchParams.get('id');
    if (!goalId) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    await db
      .delete(schema.advisorClientGoals)
      .where(eq(schema.advisorClientGoals.id, goalId))
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}