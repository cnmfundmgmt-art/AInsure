import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function generateClientNumber() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `CFP-${year}-${suffix}`;
}

function normalizeClient(c: Record<string, unknown>) {
  return {
    id: c.id,
    clientNumber: c.clientNumber,
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

// GET /api/clients - returns only current advisor's clients
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const clients = await db
      .select()
      .from(schema.advisorClients)
      .where(
        and(
          eq(schema.advisorClients.advisorId, session.userId),
          isNull(schema.advisorClients.deletedAt)
        )
      )
      .orderBy(schema.advisorClients.createdAt)
      .execute();

    return NextResponse.json(clients.map(normalizeClient));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/clients - creates client with advisor_id from session
export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      preferredLanguage = 'EN',
      notes,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 });
    }

    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const [client] = await db
      .insert(schema.advisorClients)
      .values({
        id: nanoid(),
        clientNumber: generateClientNumber(),
        advisorId: session.userId,
        firstName,
        lastName,
        gender: gender || null,
        email: email || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth || null,
        nricPassport: nricPassport || null,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressPostcode: addressPostcode || null,
        addressState: addressState || null,
        preferredLanguage: preferredLanguage || 'EN',
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await logAudit({
      userId: session.userId,
      clientId: session.clientId || '',
      action: 'create',
      resource: 'advisor_client',
      details: { client_id: client.id, name: `${firstName} ${lastName}` },
    });

    return NextResponse.json(normalizeClient(client as Record<string, unknown>), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/clients?id=xxx - update client
export async function PUT(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
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

    const id = req.nextUrl.searchParams.get('id');
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
