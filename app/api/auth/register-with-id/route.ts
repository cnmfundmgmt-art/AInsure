/**
 * POST /api/auth/register-with-id
 * Complete registration with ID document + face verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { users, clients, idDocuments, faceVerifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

/** Generate a human-readable reference ID: CFP-YYYY-XXXXXXXX */
function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const chars = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  return `CFP-${year}-${chars}`;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

async function saveFile(file: File, subDir: string): Promise<string> {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${subDir}/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const idType = formData.get('id_type') as string;
    const idImage = formData.get('id_image') as File | null;
    const selfieImage = formData.get('selfie_image') as File | null;
    const extractedDataRaw = formData.get('extracted_data') as string;
    const faceDataRaw = formData.get('face_data') as string;

    if (!email || !password || !phone || !idType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!['mykad', 'passport'].includes(idType)) {
      return NextResponse.json({ success: false, error: 'Invalid id_type' }, { status: 400 });
    }

    const role = (formData.get('role') as string) || 'user';
    const extractedData = extractedDataRaw ? JSON.parse(extractedDataRaw) : {};
    const faceData = faceDataRaw ? JSON.parse(faceDataRaw) : { match_score: 0.85, verification_status: 'pending' };

    if (!['user', 'advisor'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    const db = getDb();

    // Check duplicate email
    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    // Save files
    const idFilePath = idImage ? await saveFile(idImage, 'id_documents') : '';
    const selfieFilePath = selfieImage ? await saveFile(selfieImage, 'selfies') : '';

    // Create user
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = Math.floor(Date.now() / 1000);

    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword,
      role: role,
      verificationStatus: 'pending',
      createdAt: now,
    }).run();

    // Create client
    const clientId = randomUUID();
    const referenceId = generateReferenceId();
    console.log('[register] extractedData:', JSON.stringify(extractedData));
    console.log('[register] phone:', phone);
    await db.insert(clients).values({
      id: clientId,
      userId,
      referenceId,
      fullName: (extractedData.fullName as string) || '',
      dob: (extractedData.dob as string) || null,
      gender: (extractedData.gender as string) || null,
      age: (extractedData.age as number) || null,
      icNumber: (extractedData.icNumber as string) || null,
      phoneNumber: phone,
      nationality: (extractedData.nationality as string) || 'Malaysian',
      createdAt: now,
    }).run();

    // Save ID document
    if (idImage) {
      await db.insert(idDocuments).values({
        id: randomUUID(),
        clientId,
        documentType: idType,
        documentNumber: (extractedData.icNumber as string) || (extractedData.passportNumber as string) || null,
        fullName: (extractedData.fullName as string) || null,
        dateOfBirth: (extractedData.dob as string) || null,
        nationality: (extractedData.nationality as string) || 'Malaysian',
        address: (extractedData.addressFull as string) || null,
        filePath: idFilePath,
        ocrRawText: JSON.stringify(extractedData),
        ocrConfidence: (extractedData.confidence as number) || null,
        verificationStatus: 'pending',
        createdAt: now,
      }).run();
    }

    // Save face verification
    await db.insert(faceVerifications).values({
      id: randomUUID(),
      clientId,
      selfiePath: selfieFilePath,
      matchScore: (faceData.match_score as number) || null,
      verificationStatus: (faceData.verification_status as string) || 'pending',
      createdAt: now,
    }).run();

    return NextResponse.json({
      success: true,
      userId,
      clientId,
      referenceId,
      verificationStatus: 'pending',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[register-with-id error]', message, err);
    return NextResponse.json({ success: false, error: 'Internal server error', detail: message }, { status: 500 });
  }
}
