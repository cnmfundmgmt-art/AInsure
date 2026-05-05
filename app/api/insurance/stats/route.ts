import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { chatMessages } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();

    const result = await db
      .select({
        totalTokens: sql<number>`sum(${chatMessages.totalTokens})`,
        messageCount: sql<number>`count(*)`,
        userMessageCount: sql<number>`sum(case when ${chatMessages.role} = 'user' then 1 else 0 end)`,
        assistantMessageCount: sql<number>`sum(case when ${chatMessages.role} = 'assistant' then 1 else 0 end)`,
      })
      .from(chatMessages)
      .where(eq(chatMessages.advisorId, session.userId))
      .get();

    return NextResponse.json({
      totalTokens: result?.totalTokens || 0,
      messageCount: result?.messageCount || 0,
      userMessageCount: result?.userMessageCount || 0,
      assistantMessageCount: result?.assistantMessageCount || 0,
    });
  } catch (err) {
    console.error('[insurance/stats] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}