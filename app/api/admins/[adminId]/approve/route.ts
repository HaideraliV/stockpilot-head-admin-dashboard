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

async function forwardPost(req: Request, adminId: string, action: string) {
  const base = getBackendBaseUrl();
  const key = getHeadAdminKey();
  const body = await req.json().catch(() => ({}));

  const url = `${base}/head-admin/admins/${adminId}/${action}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-HEAD-ADMIN-KEY': key
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request, { params }: { params: { adminId: string } }) {
  return forwardPost(req, params.adminId, 'approve');
}
