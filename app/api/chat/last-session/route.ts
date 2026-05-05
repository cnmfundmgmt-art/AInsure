import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { chatMessages } from '@/lib/db/schema';
import { desc, eq, isNull, or } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const result = await db
      .select({ sessionId: chatMessages.sessionId })
      .from(chatMessages)
      .where(or(
        eq(chatMessages.advisorId, session.userId),
        isNull(chatMessages.advisorId)
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1)
      .get();

    if (!result) {
      return NextResponse.json({ sessionId: null });
    }

    return NextResponse.json({ sessionId: result.sessionId });
  } catch (err) {
    console.error('[ChatAPI] last-session error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}