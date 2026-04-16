'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle, XCircle, Clock, TrendingUp, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const API = '/api';

interface Verification {
  userId: string;
  email: string;
  fullName: string;
  icNumber: string | null;
  dob: string | null;
  phoneNumber: string | null;
  createdAt: number;
  verificationStatus: string;
  idDocument: {
    id: string;
    documentType: string;
    filePath: string;
    ocrConfidence: number | null;
  } | null;
  faceVerification: {
    id: string;
    selfiePath: string;
    matchScore: number | null;
  } | null;
}

interface Stats {
  pendingCount: number;
  approvedTodayCount: number;
  rejectedTodayCount: number;
  totalVerifiedUsers: number;
  avgProcessingTimeHours: number;
}

export default function AdvisorVerificationsPage() {
  const router = useRouter();
  const [data, setData] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchVerifications() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), status });
      if (search) params.set('search', search);
      const res = await fetch(`${API}/admin/verifications?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setTotalPages(json.pagination.pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/admin/stats`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setStats(json.stats);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, [page, status, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchVerifications();
  }

  function confidenceBadge(pct: number | null | undefined) {
    if (pct == null) return <span className="text-gray-400 text-xs">N/A</span>;
    const color = pct >= 0.85 ? 'bg-green-100 text-green-800' : pct >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{Math.round(pct * 100)}%</span>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verification Dashboard</h1>
          <p className="text-sm text-gray-500">Advisor Panel — CFP Malaysia</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <a href="/api/auth/logout" className="text-sm text-indigo-600 hover:underline">Logout</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Pending', value: stats.pendingCount, icon: Clock, color: 'text-yellow-600 bg-yellow-50', bg: 'border-yellow-200' },
              { label: 'Approved Today', value: stats.approvedTodayCount, icon: CheckCircle, color: 'text-green-600 bg-green-50', bg: 'border-green-200' },
              { label: 'Rejected Today', value: stats.rejectedTodayCount, icon: XCircle, color: 'text-red-600 bg-red-50', bg: 'border-red-200' },
              { label: 'Total Verified', value: stats.totalVerifiedUsers, icon: TrendingUp, color: 'text-blue-600 bg-blue-50', bg: 'border-blue-200' },
              { label: 'Avg Processing', value: `${stats.avgProcessingTimeHours}h`, icon: Clock, color: 'text-purple-600 bg-purple-50', bg: 'border-purple-200' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`bg-white rounded-xl border ${bg} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-64">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, IC number, or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Search
            </button>
          </form>

          <div className="flex gap-2">
            {(['pending', 'verified', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  status === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No verifications found</p>
              <p className="text-sm mt-1">All caught up! 🎉</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'IC / Passport', 'Submitted', 'OCR Confidence', 'Face Match', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr key={row.userId} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{row.fullName}</p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {row.icNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(row.createdAt * 1000).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {confidenceBadge(row.idDocument?.ocrConfidence)}
                    </td>
                    <td className="px-4 py-3">
                      {confidenceBadge(row.faceVerification?.matchScore)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/advisor/verifications/${row.userId}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
