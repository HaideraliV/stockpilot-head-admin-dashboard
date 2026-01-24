'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'DECLINED', 'SUSPENDED'] as const;

type Status = typeof STATUS_OPTIONS[number];

type AdminRow = {
  adminId: string;
  businessName: string | null;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'SUSPENDED';
  desiredUserLimit: number;
  approvedUserLimit: number | null;
  businessCode3: string | null;
  createdAt: string;
  reviewedAt: string | null;
  statusReason: string | null;
};

const statusBadge = (status: AdminRow['status']) => {
  switch (status) {
    case 'APPROVED':
      return { label: 'APPROVED', color: 'text-green-400', icon: 'OK' };
    case 'DECLINED':
      return { label: 'DECLINED', color: 'text-red-400', icon: 'X' };
    case 'SUSPENDED':
      return { label: 'SUSPENDED', color: 'text-orange-400', icon: '!' };
    default:
      return { label: 'PENDING', color: 'text-blue-300', icon: '...' };
  }
};

export default function DashboardPageClient() {
  const [statusFilter, setStatusFilter] = useState<Status>('ALL');
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitByAdmin, setLimitByAdmin] = useState<Record<string, string>>({});
  const [busyAdmin, setBusyAdmin] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admins?status=${statusFilter}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Failed to load admins');
        setAdmins([]);
        return;
      }
      setAdmins(data.admins ?? []);
    } catch {
      setError('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAdmins();
    const id = setInterval(fetchAdmins, 15000);
    return () => clearInterval(id);
  }, [fetchAdmins]);

  const onLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const onAction = async (adminId: string, action: 'approve' | 'decline' | 'suspend' | 'unsuspend') => {
    setBusyAdmin(adminId);
    setError('');

    const body: Record<string, unknown> = {};
    if (action === 'approve') {
      const value = Number(limitByAdmin[adminId] ?? '');
      if (!value || value < 1) {
        setError('Approved user limit must be at least 1.');
        setBusyAdmin(null);
        return;
      }
      body.approvedUserLimit = value;
    }

    const res = await fetch(`/api/admins/${adminId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? 'Action failed');
    } else {
      await fetchAdmins();
    }
    setBusyAdmin(null);
  };

  const cards = useMemo(() => admins.map((admin) => {
    const badge = statusBadge(admin.status);
    return (
      <div key={admin.adminId} className="relative rounded-2xl border border-brand bg-[#0F1117] p-6 shadow-xl">
        <div className={`absolute left-4 top-4 text-xs font-semibold ${badge.color}`}>{badge.icon}</div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Business Name</p>
            <p className="text-lg font-semibold text-white">{admin.businessName ?? '—'}</p>
          </div>
          <span className={`rounded-full border border-white/10 px-3 py-1 text-xs ${badge.color}`}>{badge.label}</span>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-white/80 md:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">Admin Email</p>
            <p>{admin.email}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Business Code3</p>
            <p>{admin.businessCode3 ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Desired User Limit</p>
            <p>{admin.desiredUserLimit}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Approved User Limit</p>
            <p>{admin.approvedUserLimit ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Created</p>
            <p>{new Date(admin.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Reviewed</p>
            <p>{admin.reviewedAt ? new Date(admin.reviewedAt).toLocaleString() : '—'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-white/50">Reason</p>
            <p>{admin.statusReason ?? '—'}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/50">Set user limit</label>
            <input
              type="number"
              min={1}
              className="w-28 rounded-lg border border-brand/60 bg-black/40 px-3 py-2 text-white"
              value={limitByAdmin[admin.adminId] ?? ''}
              onChange={(e) => setLimitByAdmin((prev) => ({ ...prev, [admin.adminId]: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-green-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
              disabled={busyAdmin === admin.adminId}
              onClick={() => onAction(admin.adminId, 'approve')}
            >
              Approve
            </button>
            <button
              className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              disabled={busyAdmin === admin.adminId}
              onClick={() => onAction(admin.adminId, 'decline')}
            >
              Decline
            </button>
            {admin.status === 'SUSPENDED' ? (
              <button
                className="rounded-lg bg-blue-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                disabled={busyAdmin === admin.adminId}
                onClick={() => onAction(admin.adminId, 'unsuspend')}
              >
                Unsuspend
              </button>
            ) : (
              <button
                className="rounded-lg bg-orange-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
                disabled={busyAdmin === admin.adminId}
                onClick={() => onAction(admin.adminId, 'suspend')}
              >
                Suspend
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }), [admins, busyAdmin, limitByAdmin, onAction]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Head Admin Dashboard</h1>
            <p className="text-sm text-white/60">Approve, decline, or suspend admin accounts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status)}
              className="rounded-lg border border-brand/60 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              onClick={fetchAdmins}
              className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/20"
            >
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:border-white/30"
            >
              Logout
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {loading && <p className="text-sm text-white/60">Loading...</p>}

        <div className="grid gap-6">
          {cards.length > 0 ? cards : !loading && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-white/60">
              No admins found for this status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
