/**
 * PATCH /api/admin/registrations/[clientId]/edit
 * Admin edits client registration details
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  return req.cookies.get('cfp_role')?.value === 'admin';
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await req.json();
  const { fullName, icNumber, dob, gender, age, nationality } = body;

  const db = getDb();

  // Update clients table
  const updates: Record<string, unknown> = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (icNumber !== undefined) updates.icNumber = icNumber;
  if (dob !== undefined) updates.dob = dob;
  if (gender !== undefined) updates.gender = gender;
  if (age !== undefined) updates.age = age;
  if (nationality !== undefined) updates.nationality = nationality;

  if (Object.keys(updates).length > 0) {
    await db.update(clients)
      .set(updates)
      .where(eq(clients.id, clientId))
      .run();
  }

  await logAudit({
    userId: req.cookies.get('cfp_session')?.value || 'unknown',
    clientId,
    action: 'update',
    resource: 'registration',
    details: { fieldsUpdated: Object.keys(updates) },
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({ success: true });
}