import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE = 'sp_head_admin';
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

const AUTH_TOKEN_VERSION = 'v1';

function getAuthSecret() {
  return (
    process.env.AUTH_COOKIE_SECRET ??
    process.env.HEAD_ADMIN_KEY ??
    process.env.DASHBOARD_PASSCODE ??
    ''
  );
}

function sign(payload: string) {
  const secret = getAuthSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createAuthToken(nowMs = Date.now()) {
  const expiresAt = Math.floor(nowMs / 1000) + AUTH_COOKIE_MAX_AGE_SECONDS;
  const nonce = randomBytes(16).toString('hex');
  const payload = `${AUTH_TOKEN_VERSION}.${expiresAt}.${nonce}`;
  const signature = sign(payload);
  if (!signature) return '';
  return `${payload}.${signature}`;
}

export function isAuthed(cookieValue: string | undefined) {
  if (!cookieValue) return false;

  const parts = cookieValue.split('.');
  if (parts.length !== 4) return false;

  const [version, expiresAtRaw, nonce, providedSig] = parts;
  if (
    version !== AUTH_TOKEN_VERSION ||
    !expiresAtRaw ||
    !nonce ||
    !providedSig
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${version}.${expiresAtRaw}.${nonce}`;
  const expectedSig = sign(payload);
  if (!expectedSig) return false;

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (providedBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(providedBuf, expectedBuf);
}
