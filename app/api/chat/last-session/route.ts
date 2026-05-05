import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { chatMessages } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb();
    const result = await db
      .select({ sessionId: chatMessages.sessionId })
      .from(chatMessages)
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