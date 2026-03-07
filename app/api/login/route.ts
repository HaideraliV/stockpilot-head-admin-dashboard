import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  createAuthToken,
} from '../../../lib/auth';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

type LoginAttemptState = {
  count: number;
  windowStartMs: number;
  lockedUntilMs: number;
};

const loginAttemptsByIp = new Map<string, LoginAttemptState>();

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function getAttemptState(ip: string, nowMs: number) {
  const existing = loginAttemptsByIp.get(ip);
  if (!existing) {
    const initial: LoginAttemptState = {
      count: 0,
      windowStartMs: nowMs,
      lockedUntilMs: 0,
    };
    loginAttemptsByIp.set(ip, initial);
    return initial;
  }
  if (nowMs - existing.windowStartMs > LOGIN_WINDOW_MS) {
    existing.count = 0;
    existing.windowStartMs = nowMs;
    if (existing.lockedUntilMs <= nowMs) {
      existing.lockedUntilMs = 0;
    }
  }
  return existing;
}

function applyFailedAttempt(ip: string, nowMs: number) {
  const state = getAttemptState(ip, nowMs);
  state.count += 1;
  if (state.count >= LOGIN_MAX_ATTEMPTS) {
    state.lockedUntilMs = nowMs + LOGIN_LOCK_MS;
    state.count = 0;
    state.windowStartMs = nowMs;
  }
}

export async function POST(req: Request) {
  const nowMs = Date.now();
  const ip = getClientIp(req);
  const state = getAttemptState(ip, nowMs);

  if (state.lockedUntilMs > nowMs) {
    const retryAfterSeconds = Math.ceil((state.lockedUntilMs - nowMs) / 1000);
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': `${retryAfterSeconds}` },
      }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { passcode?: string }
    | null;
  const passcode = (body?.passcode ?? '').toString();
  const expected = process.env.DASHBOARD_PASSCODE ?? '';

  if (!expected || passcode !== expected) {
    applyFailedAttempt(ip, nowMs);
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  loginAttemptsByIp.delete(ip);

  const token = createAuthToken(nowMs);
  if (!token) {
    return NextResponse.json(
      { error: 'Auth is not configured.' },
      { status: 500 }
    );
  }

  const store = cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
