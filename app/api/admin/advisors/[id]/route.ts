/**
 * GET /api/admin/advisors        — list advisor applications
 * Query params:
 *   filter=all | pending | approved | rejected  (default: pending)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.cookies.get('cfp_role')?.value !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'pending';

  // Base condition: role = advisor
  let baseCondition = eq(users.role, 'advisor');

  if (filter === 'pending') {
    // Not yet approved AND no rejection reason (i.e. awaiting review)
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        verificationStatus: users.verificationStatus,
        approvedByAdmin: users.approvedByAdmin,
        approvedAt: users.approvedAt,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
        // Client / KYC data
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        phoneNumber: clients.phoneNumber,
        referenceId: clients.referenceId,
        // ID document
        idDocumentType: idDocuments.documentType,
        idDocumentFilePath: idDocuments.filePath,
        idDocumentOcrConfidence: idDocuments.ocrConfidence,
        idDocumentFullName: idDocuments.fullName,
        idDocumentDob: idDocuments.dateOfBirth,
        idDocumentNationality: idDocuments.nationality,
        idDocumentAddress: idDocuments.address,
        // Face
        selfiePath: faceVerifications.selfiePath,
        faceMatchScore: faceVerifications.matchScore,
      })
      .from(users)
      .leftJoin(clients, eq(clients.userId, users.id))
      .leftJoin(idDocuments, eq(idDocuments.clientId, clients.id))
      .leftJoin(faceVerifications, eq(faceVerifications.clientId, clients.id))
      .where(and(baseCondition, eq(users.approvedByAdmin, false), isNull(users.rejectionReason)))
      .all();
    return NextResponse.json({ advisors: rows });
  }

  if (filter === 'approved') {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        verificationStatus: users.verificationStatus,
        approvedByAdmin: users.approvedByAdmin,
        approvedAt: users.approvedAt,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        phoneNumber: clients.phoneNumber,
        referenceId: clients.referenceId,
        idDocumentType: idDocuments.documentType,
        idDocumentFilePath: idDocuments.filePath,
        idDocumentOcrConfidence: idDocuments.ocrConfidence,
        idDocumentFullName: idDocuments.fullName,
        idDocumentDob: idDocuments.dateOfBirth,
        idDocumentNationality: idDocuments.nationality,
        idDocumentAddress: idDocuments.address,
        selfiePath: faceVerifications.selfiePath,
        faceMatchScore: faceVerifications.matchScore,
      })
      .from(users)
      .leftJoin(clients, eq(clients.userId, users.id))
      .leftJoin(idDocuments, eq(idDocuments.clientId, clients.id))
      .leftJoin(faceVerifications, eq(faceVerifications.clientId, clients.id))
      .where(and(baseCondition, eq(users.approvedByAdmin, true)))
      .all();
    return NextResponse.json({ advisors: rows });
  }

  if (filter === 'rejected') {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        companyName: users.companyName,
        licenseNumber: users.licenseNumber,
        verificationStatus: users.verificationStatus,
        approvedByAdmin: users.approvedByAdmin,
        approvedAt: users.approvedAt,
        rejectionReason: users.rejectionReason,
        createdAt: users.createdAt,
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        phoneNumber: clients.phoneNumber,
        referenceId: clients.referenceId,
        idDocumentType: idDocuments.documentType,
        idDocumentFilePath: idDocuments.filePath,
        idDocumentOcrConfidence: idDocuments.ocrConfidence,
        idDocumentFullName: idDocuments.fullName,
        idDocumentDob: idDocuments.dateOfBirth,
        idDocumentNationality: idDocuments.nationality,
        idDocumentAddress: idDocuments.address,
        selfiePath: faceVerifications.selfiePath,
        faceMatchScore: faceVerifications.matchScore,
      })
      .from(users)
      .leftJoin(clients, eq(clients.userId, users.id))
      .leftJoin(idDocuments, eq(idDocuments.clientId, clients.id))
      .leftJoin(faceVerifications, eq(faceVerifications.clientId, clients.id))
      .where(and(baseCondition, isNotNull(users.rejectionReason)))
      .all();
    return NextResponse.json({ advisors: rows });
  }

  // filter === 'all'
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      companyName: users.companyName,
      licenseNumber: users.licenseNumber,
      verificationStatus: users.verificationStatus,
      approvedByAdmin: users.approvedByAdmin,
      approvedAt: users.approvedAt,
      rejectionReason: users.rejectionReason,
      createdAt: users.createdAt,
      fullName: clients.fullName,
      icNumber: clients.icNumber,
      dob: clients.dob,
      phoneNumber: clients.phoneNumber,
      referenceId: clients.referenceId,
      idDocumentType: idDocuments.documentType,
      idDocumentFilePath: idDocuments.filePath,
      idDocumentOcrConfidence: idDocuments.ocrConfidence,
      idDocumentFullName: idDocuments.fullName,
      idDocumentDob: idDocuments.dateOfBirth,
      idDocumentNationality: idDocuments.nationality,
      idDocumentAddress: idDocuments.address,
      selfiePath: faceVerifications.selfiePath,
      faceMatchScore: faceVerifications.matchScore,
    })
    .from(users)
    .leftJoin(clients, eq(clients.userId, users.id))
    .leftJoin(idDocuments, eq(idDocuments.clientId, clients.id))
    .leftJoin(faceVerifications, eq(faceVerifications.clientId, clients.id))
    .where(baseCondition)
    .all();
  return NextResponse.json({ advisors: rows });
}
