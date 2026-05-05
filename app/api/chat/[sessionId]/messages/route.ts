/**
 * Chat History API Routes
 * CFP Malaysia - Insurance Analysis Sessions
 *
 * Uses Drizzle ORM via getDb() from lib/db/client.ts
 *
 * Endpoints:
 * POST /api/chat/[sessionId]/messages  - Add a message
 * GET  /api/chat/[sessionId]/messages  - Get conversation history
 * DELETE /api/chat/[sessionId]/messages - Delete session messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { chatMessages } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

function nanoid() {
  return Math.random().toString(36).slice(2, 12);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await req.json();
    const { role, content, metadata } = body;

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json({ error: 'role must be user, assistant, or system' }, { status: 400 });
    }
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const db = getDb();
    const id = nanoid();
    const createdAt = Math.floor(Date.now() / 1000);

    await db.insert(chatMessages).values({
      id,
      sessionId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt,
    }).run();

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (err) {
    console.error('[ChatAPI] POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'full';
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 5000);

    const db = getDb();
    const result = await db.select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(sql`${chatMessages.sessionId} = ${sessionId}`)
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .all()
      .then(rows => rows.reverse());

    const messages = result.map((row: { role: string; content: string }) => ({
      role: row.role,
      content: row.content,
    }));

    if (format === 'openai') {
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ messages, count: messages.length });
  } catch (err) {
    console.error('[ChatAPI] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const db = getDb();
    await db.delete(chatMessages).where(sql`${chatMessages.sessionId} = ${sessionId}`).run();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ChatAPI] DELETE error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}