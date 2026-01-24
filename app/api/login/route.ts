import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from '../../../lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { passcode?: string } | null;
  const passcode = (body?.passcode ?? '').toString();
  const expected = process.env.DASHBOARD_PASSCODE ?? '';

  if (!expected || passcode !== expected) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const store = cookies();
  store.set(AUTH_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return NextResponse.json({ ok: true });
}
