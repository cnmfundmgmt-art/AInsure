/**
 * GET  /api/admin/verifications        — list pending verifications
 * POST /api/admin/verifications/:id/approve — approve a user
 * POST /api/admin/verifications/:id/reject  — reject with reason
 * Role: advisor or admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function requireAdvisor(req: NextRequest): string | null {
  const role = req.cookies.get('cfp_role')?.value;
  if (role === 'advisor' || role === 'admin') return role;
  return null;
}

function requireSession(req: NextRequest): string | null {
  return req.cookies.get('cfp_session')?.value || null;
}

// ─── GET /api/admin/verifications ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const role = requireAdvisor(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const sessionId = requireSession(req);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'pending';

  const db = getDb();

  // Build where clause
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(clients.fullName, `%${search}%`),
        like(clients.icNumber, `%${search}%`),
        like(users.email, `%${search}%`),
      )!
    );
  }

  if (status === 'pending') {
    conditions.push(eq(users.verificationStatus, 'pending'));
  } else if (status === 'verified') {
    conditions.push(eq(users.verificationStatus, 'verified'));
  } else if (status === 'rejected') {
    conditions.push(eq(users.verificationStatus, 'rejected'));
  }

  // Count total
  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .innerJoin(clients, eq(users.id, clients.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .get();

  // Fetch pending verifications
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      verificationStatus: users.verificationStatus,
      fullName: clients.fullName,
      icNumber: clients.icNumber,
      dob: clients.dob,
      phoneNumber: clients.phoneNumber,
    })
    .from(users)
    .innerJoin(clients, eq(users.id, clients.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Enrich with id_documents and face_verifications
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const idDoc = await db
        .select()
        .from(idDocuments)
        .where(eq(idDocuments.clientId, row.id))
        .get();

      const face = await db
        .select()
        .from(faceVerifications)
        .where(eq(faceVerifications.clientId, row.id))
        .get();

      return {
        userId: row.id,
        email: row.email,
        createdAt: row.createdAt,
        verificationStatus: row.verificationStatus,
        fullName: row.fullName,
        icNumber: row.icNumber,
        dob: row.dob,
        phoneNumber: row.phoneNumber,
        idDocument: idDoc
          ? {
              id: idDoc.id,
              documentType: idDoc.documentType,
              filePath: idDoc.filePath,
              ocrConfidence: idDoc.ocrConfidence,
              address: idDoc.address,
            }
          : null,
        faceVerification: face
          ? { id: face.id, selfiePath: face.selfiePath, matchScore: face.matchScore }
          : null,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: enriched,
    pagination: {
      page,
      limit,
      total: totalResult?.count || 0,
      pages: Math.ceil((totalResult?.count || 0) / limit),
    },
  });
}

// ─── POST /api/admin/verifications/:id/approve ───────────────────────────────

export async function POST(req: NextRequest) {
  const role = requireAdvisor(req);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const sessionId = requireSession(req);
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const action = pathParts[pathParts.length - 1]; // 'approve' or 'reject'
  const verificationId = pathParts[pathParts.length - 2]; // user id

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  try {
    const body = await req.json().catch(() => ({}));
    const rejectionReason = action === 'reject' ? (body.reason || '') : '';

    // Update user status
    await db
      .update(users)
      .set({ verificationStatus: action === 'approve' ? 'verified' : 'rejected' })
      .where(eq(users.id, verificationId))
      .run();

    // Update id_document status
    const idDoc = await db
      .select({ id: idDocuments.id })
      .from(idDocuments)
      .innerJoin(clients, eq(idDocuments.clientId, clients.id))
      .where(eq(clients.userId, verificationId))
      .get();

    if (idDoc) {
      await db
        .update(idDocuments)
        .set({
          verificationStatus: action === 'approve' ? 'verified' : 'rejected',
          verifiedBy: sessionId,
          verifiedAt: now,
        })
        .where(eq(idDocuments.id, idDoc.id))
        .run();
    }

    // Audit log
    await logAudit({
      userId: sessionId,
      clientId: verificationId,
      action: action,
      resource: 'verification',
      details: { reason: rejectionReason },
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
    });

    // Mock email notification
    const user = await db.select({ email: users.email }).from(users).where(eq(users.id, verificationId)).get();
    if (action === 'approve') {
      console.log(`[Email] Account verified: ${user?.email}`);
    } else {
      console.log(`[Email] Account rejected for ${user?.email}: ${rejectionReason}`);
    }

    return NextResponse.json({ success: true, action, userId: verificationId });
  } catch (err) {
    console.error('[verify error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
