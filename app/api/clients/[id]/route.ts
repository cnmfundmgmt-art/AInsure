import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, and, isNull } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function normalizeClient(c: Record<string, unknown>) {
  return {
    id: c.id,
    advisorId: c.advisorId,
    firstName: c.firstName,
    lastName: c.lastName,
    gender: c.gender,
    email: c.email,
    phone: c.phone,
    dateOfBirth: c.dateOfBirth,
    nricPassport: c.nricPassport,
    addressStreet: c.addressStreet,
    addressCity: c.addressCity,
    addressPostcode: c.addressPostcode,
    addressState: c.addressState,
    preferredLanguage: c.preferredLanguage,
    notes: c.notes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function getClientId(req: NextRequest) {
  return req.nextUrl.searchParams.get('id');
}

// PUT /api/clients?id=xxx - update client
export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = getClientId(req);
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    const existing = await db
      .select()
      .from(schema.advisorClients)
      .where(
        and(
          eq(schema.advisorClients.id, id),
          eq(schema.advisorClients.advisorId, session.userId),
          isNull(schema.advisorClients.deletedAt)
        )
      )
      .get();

    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const body = await req.json();
    const {
      firstName,
      lastName,
      gender,
      email,
      phone,
      dateOfBirth,
      nricPassport,
      addressStreet,
      addressCity,
      addressPostcode,
      addressState,
      preferredLanguage,
      notes,
    } = body;

    await db
      .update(schema.advisorClients)
      .set({
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(gender !== undefined && { gender }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth || null }),
        ...(nricPassport !== undefined && { nricPassport: nricPassport || null }),
        ...(addressStreet !== undefined && { addressStreet: addressStreet || null }),
        ...(addressCity !== undefined && { addressCity: addressCity || null }),
        ...(addressPostcode !== undefined && { addressPostcode: addressPostcode || null }),
        ...(addressState !== undefined && { addressState: addressState || null }),
        ...(preferredLanguage !== undefined && { preferredLanguage: preferredLanguage || 'EN' }),
        ...(notes !== undefined && { notes: notes || null }),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(schema.advisorClients.id, id))
      .run();

    await logAudit({
      userId: session.userId,
      clientId: session.clientId || '',
      action: 'update',
      resource: 'advisor_client',
      details: { client_id: id },
    });

    const updated = await db
      .select()
      .from(schema.advisorClients)
      .where(eq(schema.advisorClients.id, id))
      .get();

    return NextResponse.json(normalizeClient(updated as Record<string, unknown>));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/clients?id=xxx - soft delete client
export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = getClientId(req);
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = getDb();
    const existing = await db
      .select()
      .from(schema.advisorClients)
      .where(
        and(
          eq(schema.advisorClients.id, id),
          eq(schema.advisorClients.advisorId, session.userId),
          isNull(schema.advisorClients.deletedAt)
        )
      )
      .get();

    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    await db
      .update(schema.advisorClients)
      .set({ deletedAt: Math.floor(Date.now() / 1000) })
      .where(eq(schema.advisorClients.id, id))
      .run();

    await logAudit({
      userId: session.userId,
      clientId: session.clientId || '',
      action: 'delete',
      resource: 'advisor_client',
      details: { client_id: id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
