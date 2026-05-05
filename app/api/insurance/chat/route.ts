import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/services/insurance-chat.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, clientContext } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const result = await chat({ sessionId, message, clientContext });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[insurance/chat] error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}