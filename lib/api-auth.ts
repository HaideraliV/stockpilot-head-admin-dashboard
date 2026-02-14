import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, isAuthed } from './auth';

export function requireApiAuth() {
  const authed = isAuthed(cookies().get(AUTH_COOKIE)?.value);
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
