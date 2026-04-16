/**
 * GET /api/admin/me — returns the role of the current admin session
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const role = req.cookies.get('cfp_role')?.value;
  if (role !== 'admin' && role !== 'advisor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return NextResponse.json({ role });
}
