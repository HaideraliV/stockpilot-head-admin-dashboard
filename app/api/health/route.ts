import { NextResponse } from 'next/server';

export async function GET() {
  const hasBaseUrl = !!process.env.NEXT_PUBLIC_API_BASE_URL;
  const hasHeadKey = !!process.env.HEAD_ADMIN_KEY;
  return NextResponse.json({ ok: true, hasBaseUrl, hasHeadKey });
}
