/**
 * GET /api/verification/[id]/document
 * Serves the ID document image for an advisor/client
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = params.id;

  const db = getDb();

  // Look up the client for this user
  const client = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId))
    .get();

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Get the ID document
  const doc = await db
    .select({
      filePath: idDocuments.filePath,
      documentType: idDocuments.documentType,
    })
    .from(idDocuments)
    .where(eq(idDocuments.clientId, client.id))
    .get();

  if (!doc || !doc.filePath) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Serve the file
  const filePath = path.resolve(doc.filePath);
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
