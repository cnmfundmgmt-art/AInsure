/**
 * GET  /api/client/profile — get current user's client profile
 * PUT  /api/client/profile — update editable fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { clients, users, idDocuments, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const FIELD_MAP: Record<string, string> = {
  marital_status: 'maritalStatus',
  dependents: 'dependents',
  employment_status: 'employmentStatus',
  occupation: 'occupation',
  employer: 'employer',
  annual_income: 'annualIncome',
  phone_number: 'phoneNumber',
};

function toCamelCase(obj: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[FIELD_MAP[k] ?? k] = v;
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins don't have a client profile
  if (session.role === 'admin') {
    return NextResponse.json({ error: 'Not applicable for admin' }, { status: 400 });
  }

  const db = getDb();

  // Single query: client + user + id_document in one go
  const [clientData, idDoc] = await Promise.all([
    db
      .select({
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        nationality: clients.nationality,
        maritalStatus: clients.maritalStatus,
        dependents: clients.dependents,
        employmentStatus: clients.employmentStatus,
        occupation: clients.occupation,
        employer: clients.employer,
        annualIncome: clients.annualIncome,
        phoneNumber: clients.phoneNumber,
        email: users.email,
        verificationStatus: users.verificationStatus,
        clientId: clients.id,
      })
      .from(clients)
      .leftJoin(users, eq(clients.userId, users.id))
      .where(eq(clients.id, session.clientId))
      .limit(1)
      .get(),

    db
      .select({
        documentType: idDocuments.documentType,
        verificationStatus: idDocuments.verificationStatus,
        verifiedAt: idDocuments.verifiedAt,
        verifiedBy: idDocuments.verifiedBy,
        createdAt: idDocuments.createdAt,
      })
      .from(idDocuments)
      .where(eq(idDocuments.clientId, session.clientId))
      .limit(1)
      .get(),
  ]);

  if (!clientData) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  return NextResponse.json({ ...clientData, verification_timeline: idDoc ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins don't have a client profile
  if (session.role === 'admin') {
    return NextResponse.json({ error: 'Not applicable for admin' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { updateClientSchema } = await import('@/lib/validations/client');
  const validation = updateClientSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
  }

  const camelData = toCamelCase(validation.data as Record<string, unknown>);

  // Normalise annual_income: convert range strings like "50000-100000" → midpoint number
  if (typeof (camelData as Record<string,unknown>).annualIncome === 'string') {
    const s = String((camelData as Record<string,unknown>).annualIncome);
    if (s.includes('-')) {
      const [lo, hi] = s.split('-').map(Number);
      (camelData as Record<string,unknown>).annualIncome = !isNaN(lo) && !isNaN(hi) ? (lo + hi) / 2 : null;
    }
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  await db
    .update(clients)
    .set(camelData as Record<string, unknown>)
    .where(eq(clients.id, session.clientId))
    .run();

  await db.insert(auditLogs).values({
    id: randomUUID(),
    userId: session.userId,
    clientId: session.clientId,
    action: 'profile_update',
    resource: 'client_profile',
    details: JSON.stringify(body),
    createdAt: now,
  }).run();

  return NextResponse.json({ success: true, data: camelData });
}