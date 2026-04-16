'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight,
  Shield, ArrowUpDown, Clock, CheckCircle, XCircle,
  UserCheck, FileText, LogIn, LogOut, Pencil
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  approve: <CheckCircle className="w-4 h-4 text-green-600" />,
  reject: <XCircle className="w-4 h-4 text-red-600" />,
  update: <Pencil className="w-4 h-4 text-blue-600" />,
  login: <LogIn className="w-4 h-4 text-indigo-600" />,
  logout: <LogOut className="w-4 h-4 text-gray-500" />,
};

const RESOURCE_LABELS: Record<string, string> = {
  registration: 'Registration',
  verification: 'Verification',
  admin_session: 'Admin Login',
  client: 'Client',
};

const ACTION_LABELS: Record<string, string> = {
  approve: 'Approved',
  reject: 'Rejected',
  update: 'Updated',
  login: 'Logged In',
  logout: 'Logged Out',
  create: 'Created',
  delete: 'Deleted',
};

interface AuditLog {
  id: string;
  userId: string;
  clientId: string;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: number;
  actorEmail: string;
  clientName: string;
}

async function fetchAuditLogs(params: {
  resource?: string;
  action?: string;
  page: number;
}) {
  const sp = new URLSearchParams({
    page: String(params.page),
    ...(params.resource ? { resource: params.resource } : {}),
    ...(params.action ? { action: params.action } : {}),
  });
  const res = await fetch(`${API_BASE}/api/admin/audit?${sp}`, { credentials: 'include' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch audit logs');
  return json as {
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-audit', page, resource, action],
    queryFn: () => fetchAuditLogs({ resource, action, page }),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">CFP Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Audit Trail</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a href="/admin" className="flex items-center gap-2 px-4 py-2.5 rounded text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition">
            <FileText className="w-4 h-4" /> Registrations
          </a>
          <a href="/admin/audit" className="flex items-center gap-2 px-4 py-2.5 rounded bg-indigo-600 text-white font-medium">
            <Shield className="w-4 h-4" /> Audit Log
          </a>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-gray-500 text-sm mt-1">All advisor and admin actions across the platform</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Resource</label>
            <select
              value={resource}
              onChange={(e) => { setResource(e.target.value); handleFilterChange(); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="registration">Registration</option>
              <option value="verification">Verification</option>
              <option value="admin_session">Admin Session</option>
              <option value="client">Client</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); handleFilterChange(); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="update">Update</option>
              <option value="login">Login</option>
            </select>
          </div>
          <button
            onClick={() => { setResource(''); setAction(''); setPage(1); }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Clock className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3 px-6 py-12 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>{error instanceof Error ? error.message : 'Something went wrong'}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-20 text-gray-400">
              <ArrowUpDown className="w-10 h-10" />
              <p className="font-medium text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Time', 'Actor', 'Action', 'Resource', 'Client', 'Details', 'IP'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{log.actorEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {ACTION_ICONS[log.action] || <Clock className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-700">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {RESOURCE_LABELS[log.resource] || log.resource}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{log.clientName || log.clientId || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {log.details
                          ? Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.pages} &middot; {pagination.total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
