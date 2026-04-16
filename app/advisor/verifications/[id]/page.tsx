'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft,
  User, FileText, ScanFace, Shield, Phone, Mail, Calendar, MapPin, Clock
} from 'lucide-react';

const API = '/api';

interface VerificationDetail {
  userId: string;
  email: string;
  createdAt: number;
  verificationStatus: string;
  fullName: string;
  icNumber: string | null;
  dob: string | null;
  phoneNumber: string | null;
  nationality: string | null;
  idDocument: {
    id: string;
    documentType: string;
    filePath: string;
    documentNumber: string | null;
    fullName: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    address: string | null;
    ocrConfidence: number | null;
    verificationStatus: string;
    verifiedBy: string | null;
    verifiedAt: number | null;
  } | null;
  faceVerification: {
    id: string;
    selfiePath: string;
    matchScore: number | null;
    verificationStatus: string;
  } | null;
  auditLogs: Array<{
    id: string;
    action: string;
    resource: string;
    ipAddress: string;
    createdAt: number;
  }>;
}

export default function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', status: '' });
      const res = await fetch(`${API}/admin/verifications?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        // Find this specific user
        const record = json.data.find((d: VerificationDetail) => d.userId === id);
        if (record) {
          setData(record);
        } else {
          // Try fetching all and filter
          const allRes = await fetch(`${API}/admin/verifications?page=1&status=pending`, { credentials: 'include' });
          const allJson = await allRes.json();
          const found = allJson.data?.find((d: VerificationDetail) => d.userId === id);
          if (found) {
            setData(found);
          } else {
            // Try fetching user directly
            const userRes = await fetch(`${API}/admin/verifications?page=1&status=verified`, { credentials: 'include' });
            const userJson = await userRes.json();
            const vf = userJson.data?.find((d: VerificationDetail) => d.userId === id);
            if (vf) setData(vf);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectModal) {
      setRejectModal(true);
      return;
    }
    if (action === 'reject' && !rejectReason.trim()) {
      setRejectError('Please provide a rejection reason');
      return;
    }

    setActionLoading(action);
    setRejectError('');

    try {
      const body = action === 'reject' ? JSON.stringify({ reason: rejectReason }) : '{}';
      const res = await fetch(`${API}/admin/verifications/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => prev ? { ...prev, verificationStatus: action === 'approve' ? 'verified' : 'rejected' } : prev);
        setRejectModal(false);
        if (action === 'approve') {
          alert('✅ User verified successfully!');
        } else {
          alert('❌ User rejected');
        }
      } else {
        setRejectError(json.error || 'Action failed');
      }
    } catch (e) {
      setRejectError('Network error');
    } finally {
      setActionLoading(null);
    }
  }

  function confidenceColor(pct: number | null | undefined) {
    if (pct == null) return 'text-gray-400';
    if (pct >= 0.85) return 'text-green-600';
    if (pct >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }

  function MatchGauge({ score }: { score: number | null | undefined }) {
    const pct = score != null ? score * 100 : 0;
    const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path d={`M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831`} fill="none" strokeWidth="3" strokeDasharray={`${pct}, 100`} className={color} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${confidenceColor(score)}`}>{Math.round(pct)}%</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">Face Match Score</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">Verification not found</p>
          <button onClick={() => router.push('/advisor/verifications')} className="mt-4 text-indigo-600 underline">← Back</button>
        </div>
      </div>
    );
  }

  const idd = data.idDocument;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/advisor/verifications')} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Verification Detail</h1>
          <p className="text-sm text-gray-500">{data.fullName} — {data.icNumber || 'N/A'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          data.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
          data.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {data.verificationStatus.charAt(0).toUpperCase() + data.verificationStatus.slice(1)}
        </span>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Action buttons */}
        {data.verificationStatus === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('approve')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve Verification
            </button>
            <button
              onClick={() => setRejectModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: ID Document */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-indigo-900">ID Document</h2>
            </div>

            {/* ID Image */}
            {idd?.filePath && (
              <div className="p-4 border-b border-gray-100">
                <img
                  src={idd.filePath}
                  alt="ID Document"
                  className="max-h-64 mx-auto rounded-lg object-contain border border-gray-200"
                />
              </div>
            )}

            {/* OCR vs Confirmed Data */}
            <div className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Data Comparison</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Extracted (OCR)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: 'Full Name', ocr: idd?.fullName, confirmed: data.fullName },
                    { label: 'IC/Passport', ocr: idd?.documentNumber, confirmed: data.icNumber },
                    { label: 'Date of Birth', ocr: idd?.dateOfBirth, confirmed: data.dob },
                    { label: 'Nationality', ocr: idd?.nationality, confirmed: data.nationality },
                    { label: 'Address', ocr: idd?.address, confirmed: '' },
                  ].map(({ label, ocr, confirmed }) => (
                    <tr key={label}>
                      <td className="px-3 py-2.5 font-medium text-gray-600 text-xs">{label}</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs font-mono">{ocr || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-900 text-xs font-mono">
                        {confirmed || (label === 'Address' ? idd?.address?.substring(0, 40) + '...' : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Confidence */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-gray-600">OCR Confidence:</span>
                <span className={`text-lg font-bold ${confidenceColor(idd?.ocrConfidence)}`}>
                  {idd?.ocrConfidence != null ? `${Math.round(idd.ocrConfidence * 100)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Face Verification */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
              <ScanFace className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-indigo-900">Face Verification</h2>
            </div>

            <div className="p-5 flex flex-col items-center gap-6">
              {/* Selfie */}
              {data.faceVerification?.selfiePath ? (
                <img
                  src={data.faceVerification.selfiePath}
                  alt="Selfie"
                  className="w-48 h-48 rounded-xl object-cover border-2 border-indigo-200"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-gray-100 flex items-center justify-center">
                  <ScanFace className="w-16 h-16 text-gray-300" />
                </div>
              )}

              {/* Match Gauge */}
              <MatchGauge score={data.faceVerification?.matchScore} />

              {/* Status badge */}
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                (data.faceVerification?.matchScore || 0) >= 0.8
                  ? 'bg-green-100 text-green-800'
                  : (data.faceVerification?.matchScore || 0) >= 0.6
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {(data.faceVerification?.matchScore || 0) >= 0.8 ? 'PASSED' :
                 (data.faceVerification?.matchScore || 0) >= 0.6 ? 'REVIEW NEEDED' : 'FAILED'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: User Details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <h2 className="font-semibold text-gray-800">User Details</h2>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Email', value: data.email, icon: Mail },
              { label: 'Phone', value: data.phoneNumber || 'N/A', icon: Phone },
              { label: 'Registration Date', value: new Date(data.createdAt * 1000).toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' }), icon: Calendar },
              { label: 'ID Type', value: idd?.documentType?.toUpperCase() || 'N/A', icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        {data.auditLogs && data.auditLogs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <h2 className="font-semibold text-gray-800">Audit Log</h2>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Action</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="py-2 font-medium text-gray-700">{log.action}</td>
                      <td className="py-2 text-gray-500">{new Date(log.createdAt * 1000).toLocaleString('en-MY')}</td>
                      <td className="py-2 text-gray-400 font-mono text-xs">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection. The user will be notified.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. IC number does not match name..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            {rejectError && <p className="text-red-500 text-sm mt-2">{rejectError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(false)} className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button
                onClick={() => handleAction('reject')}
                disabled={actionLoading === 'reject'}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
