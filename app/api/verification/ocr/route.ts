/**
 * POST /api/verification/ocr
 * Accepts multipart/form-data with file and id_type
 * Runs OCR and returns extracted data
 *
 * Query param ?stream=1 → streams SSE progress events before returning result
 * Query param ?stream=0 (default) → single JSON response
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractMyKad, extractPassport } from '@/lib/services/id-extraction.service';
import path from 'path';
import fs from 'fs';
import os from 'os';

export const dynamic = 'force-dynamic';

// ─── Streaming mode (SSE) — for progress feedback ───────────────────────────────
export async function POST(req: NextRequest) {
  const stream = req.nextUrl.searchParams.get('stream') === '1';
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const idType = formData.get('id_type') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (!idType || !['mykad', 'passport'].includes(idType)) {
      return NextResponse.json({ success: false, error: 'id_type must be "mykad" or "passport"' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (stream) {
      // ── SSE stream mode ──────────────────────────────────────────────────────
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          function send(event: string, data: unknown) {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          }
          try {
            send('phase', { phase: 'initialising', message: 'Setting up OCR engine…' });
            const extractor = idType === 'mykad' ? extractMyKad : extractPassport;
            const result = await extractor(buffer);
            if (!result.success || !result.data) {
              send('error', { error: result.error || 'Extraction failed. Please try with a clearer photo.' });
            } else {
              send('done', { data: result.data });
            }
          } catch (err) {
            send('error', { error: (err as Error).message });
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // ── Standard mode (no streaming) ───────────────────────────────────────────
    const tmpDir = os.tmpdir();
    const ext = file.name.split('.').pop() || 'jpg';
    const tmpPath = path.join(tmpDir, `cfp-ocr-${Date.now()}.${ext}`);
    fs.writeFileSync(tmpPath, buffer);

    const result = idType === 'mykad'
      ? await extractMyKad(buffer)
      : await extractPassport(buffer);

    fs.unlinkSync(tmpPath);

    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[OCR route error]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
