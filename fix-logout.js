const fs = require('fs');
const path = require('path');
const content = `import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    await signOut();
    return NextResponse.redirect(new URL('/login', req.url).toString(), { status: 302 });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.redirect(new URL('/login', req.url).toString(), { status: 302 });
  }
}

export async function DELETE(_req) {
  return POST(_req);
}
`;
const filePath = path.join(__dirname, 'app/api/auth/logout/route.ts');
fs.writeFileSync(filePath, content);
console.log('Written:', filePath);
