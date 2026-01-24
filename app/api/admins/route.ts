import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }
  return base.replace(/\/+$/, '');
}

function getHeadAdminKey() {
  const key = process.env.HEAD_ADMIN_KEY;
  if (!key) {
    throw new Error('HEAD_ADMIN_KEY is not set');
  }
  return key;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'ALL';

  const base = getBackendBaseUrl();
  const key = getHeadAdminKey();
  const url = `${base}/head-admin/admins?status=${encodeURIComponent(status)}`;

  const res = await fetch(url, {
    headers: {
      'X-HEAD-ADMIN-KEY': key
    },
    cache: 'no-store'
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
