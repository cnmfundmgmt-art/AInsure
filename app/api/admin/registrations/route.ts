/**
 * GET /api/admin/registrations - list all registrations with status filter
 * Query params: status=pending|verified|rejected, page, search
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('cfp_role')?.value;
  return role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 10;
  const offset = (page - 1) * limit;
  const search = searchParams.get('search') || '';

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(clients.fullName, `%${search}%`),
        like(clients.icNumber, `%${search}%`),
        like(users.email, `%${search}%`),
        like(clients.referenceId, `%${search}%`),
      )!
    );
  }

  conditions.push(eq(users.verificationStatus, status as 'pending' | 'verified' | 'rejected'));

  const totalRow = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .innerJoin(clients, eq(users.id, clients.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .get();

  const rows = await db
    .select({
      clientId: clients.id,
      referenceId: clients.referenceId,
      userId: clients.userId,
      role: users.role,
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
      docNationality: idDocuments.nationality,
      docAddress: idDocuments.address,
      docFilePath: idDocuments.filePath,
      docOcrRawText: idDocuments.ocrRawText,
      docConfidence: idDocuments.ocrConfidence,
      docVerificationStatus: idDocuments.verificationStatus,
      faceId: faceVerifications.id,
      selfiePath: faceVerifications.selfiePath,
      matchScore: faceVerifications.matchScore,
      faceVerificationStatus: faceVerifications.verificationStatus,
    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .leftJoin(idDocuments, eq(idDocuments.clientId, clients.id))
    .leftJoin(faceVerifications, eq(faceVerifications.clientId, clients.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return NextResponse.json({
    registrations: rows,
    pagination: {
      page,
      limit,
      total: totalRow?.count || 0,
      pages: Math.ceil((totalRow?.count || 0) / limit),
    },
  });
}