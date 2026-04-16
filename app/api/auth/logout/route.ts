import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('cfp_session');
  return NextResponse.redirect(new URL('/login', req.url).toString(), { status: 302 });
}

export async function POST(req: NextRequest) {
  return GET(req);
}

export async function DELETE(req: NextRequest) {
  return GET(req);
}
