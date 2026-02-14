import { NextResponse } from 'next/server';
import { requireApiAuth } from '../../../../../lib/api-auth';

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

export async function POST(_req: Request, { params }: { params: { adminId: string } }) {
  const unauthorized = requireApiAuth();
  if (unauthorized) return unauthorized;

  const base = getBackendBaseUrl();
  const key = getHeadAdminKey();
  const url = `${base}/head-admin/admins/${params.adminId}/recover`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-HEAD-ADMIN-KEY': key
    },
    body: JSON.stringify({})
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
