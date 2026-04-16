/**
 * GET  /api/admin/registrations/:clientId   - full detail
 * PATCH /api/admin/registrations/:clientId  - admin edits
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.cookies.get('cfp_role')?.value === 'admin';
}

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const row = await db
    .select({
      clientId: clients.id,
      userId: clients.userId,
      fullName: clients.fullName,
      icNumber: clients.icNumber,
      dob: clients.dob,
      gender: clients.gender,
      age: clients.age,
      nationality: clients.nationality,
      phoneNumber: clients.phoneNumber,
      email: users.email,
      verificationStatus: users.verificationStatus,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(eq(clients.id, params.clientId))
    .get();

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const docs = await db.select().from(idDocuments).where(eq(idDocuments.clientId, params.clientId)).all();
  const faces = await db.select().from(faceVerifications).where(eq(faceVerifications.clientId, params.clientId)).all();

  return NextResponse.json({ ...row, documents: docs, faceVerifications: faces });
}

export async function PATCH(req: NextRequest, { params }: { params: { clientId: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const body = await req.json().catch(() => ({}));

  await db.update(clients)
    .set({
      ...(body.fullName !== undefined && { fullName: body.fullName }),
      ...(body.icNumber !== undefined && { icNumber: body.icNumber }),
      ...(body.dob !== undefined && { dob: body.dob }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.age !== undefined && { age: body.age }),
      ...(body.nationality !== undefined && { nationality: body.nationality }),
      ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber }),
    })
    .where(eq(clients.id, params.clientId))
    .run();

  await db.update(idDocuments)
    .set({
      ...(body.docAddress !== undefined && { address: body.docAddress }),
      ...(body.docNationality !== undefined && { nationality: body.docNationality }),
    })
    .where(eq(idDocuments.clientId, params.clientId))
    .run();

  return NextResponse.json({ success: true });
}