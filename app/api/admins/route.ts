import { NextResponse } from 'next/server';
import { requireApiAuth } from '../../../lib/api-auth';

function getBackendBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  return base ? base.replace(/\/+$/, '') : '';
}

function getHeadAdminKey() {
  return process.env.HEAD_ADMIN_KEY ?? '';
}

export async function GET(req: Request) {
  const unauthorized = requireApiAuth();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'ALL';

  const base = getBackendBaseUrl();
  const key = getHeadAdminKey();
  const missing: string[] = [];
  if (!base) missing.push('NEXT_PUBLIC_API_BASE_URL');
  if (!key) missing.push('HEAD_ADMIN_KEY');
  if (missing.length > 0) {
    return NextResponse.json({ code: 'MISSING_ENV', missing }, { status: 500 });
  }

  const url = `${base}/head-admin/admins?status=${encodeURIComponent(status)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-HEAD-ADMIN-KEY': key
      },
      cache: 'no-store'
    });

    const text = await res.text();
    const json = (() => {
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return null;
      }
    })();

    if (!res.ok) {
      return NextResponse.json(
        {
          code: 'UPSTREAM_ERROR',
          upstreamStatus: res.status,
          upstreamBodyPreview: text.slice(0, 500)
        },
        { status: res.status }
      );
    }

    return NextResponse.json(json ?? { ok: true }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        code: 'FETCH_FAILED',
        message: err?.message ?? 'Fetch failed',
        upstreamUrl: url
      },
      { status: 502 }
    );
  }
}
