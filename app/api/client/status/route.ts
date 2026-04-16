/**
 * GET /api/client/status
 * Returns verification status and profile completion for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { clients, users, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins don't have a client profile
  if (session.role === 'admin') {
    return NextResponse.json({ error: 'Not applicable for admin' }, { status: 400 });
  }

  const db = getDb();

  const [clientData, idDoc, faceData, userData] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1).get(),
    db.select().from(idDocuments).where(eq(idDocuments.clientId, session.clientId)).limit(1).get(),
    db.select().from(faceVerifications).where(eq(faceVerifications.clientId, session.clientId)).limit(1).get(),
    db.select({ verificationStatus: users.verificationStatus }).from(users).where(eq(users.id, session.userId)).get(),
  ]);

  const idUploaded = !!idDoc;
  const faceVerified = !!(faceData && faceData.matchScore !== null && faceData.matchScore >= 0.8);
  const adminVerified = userData?.verificationStatus === 'verified';

  // Profile completion check — 8 key fields for advisor assessment
  const requiredFields = ['maritalStatus', 'employmentStatus', 'phoneNumber', 'occupation', 'employer', 'annualIncome', 'dependents'];
  const client = clientData || {};
  const c = client as Record<string, unknown>;
  const filledFields = requiredFields.filter(f => c[f] != null && c[f] !== '');
  const profileCompletion = Math.round((filledFields.length / requiredFields.length) * 100);
  const missingFields = requiredFields.filter(f => c[f] == null || c[f] === '');

  return NextResponse.json({
    id_uploaded: idUploaded,
    face_verified: faceVerified,
    admin_verified: adminVerified,
    profile_completion_percentage: profileCompletion,
    missing_fields: missingFields,
    overall_status: adminVerified && profileCompletion === 100 ? 'complete' : 'incomplete',
  });
}