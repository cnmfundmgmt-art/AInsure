/**
 * POST /api/verification/face
 * Accepts selfie + reference ID image, returns face match score
 * MVP: returns mock 0.85 score
 * Production: uses face-api.js to compare faces
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Note: face-api.js requires browser environment.
// For Next.js server routes, face comparison must be done client-side
// using face-api.js in the browser, then the match result sent here.
// This route serves as the verification record creation endpoint.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const selfie = formData.get('selfie') as File | null;
    const refImage = formData.get('ref_image') as File | null;
    const clientId = formData.get('client_id') as string | null;

    if (!selfie) {
      return NextResponse.json({ success: false, error: 'Selfie is required' }, { status: 400 });
    }

    // MVP: Return mock match score
    // Production: Client-side face-api.js computes the actual match
    const mockMatchScore = 0.85;
    const status = mockMatchScore >= 0.80 ? 'passed' : 'failed';

    return NextResponse.json({
      success: true,
      match_score: mockMatchScore,
      verification_status: status,
      message: status === 'passed'
        ? 'Face verification passed — similarity score ≥ 80%'
        : 'Face verification failed — similarity score < 80%',
    });
  } catch (err) {
    console.error('[Face verification error]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
