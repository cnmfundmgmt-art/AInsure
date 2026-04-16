/**
 * GET /api/verification/[id]/selfie
 * Serves the selfie/face verification image for an advisor/client
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { clients, faceVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = params.id;

  const db = getDb();

  const client = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId))
    .get();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const face = await db
    .select({ selfiePath: faceVerifications.selfiePath })
    .from(faceVerifications)
    .where(eq(faceVerifications.clientId, client.id))
    .get();

  if (!face || !face.selfiePath) {
    return NextResponse.json({ error: 'Selfie not found' }, { status: 404 });
  }

  const filePath = path.resolve(face.selfiePath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
  });
}
