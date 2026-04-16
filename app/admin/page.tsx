'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Clock, Loader2,
  Pencil, Save, X, ChevronLeft, ChevronRight,
  User, Users, FileText, Image as ImageIcon, AlertCircle,
  LogOut, Shield, LogIn, Building2, Hash, Mail, Eye,
  MapPin, Percent, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Shared Types ─────────────────────────────────────────────────────────────

interface BaseRecord {
  userId: string;
  clientId: string;
  referenceId: string;
  email: string;
  role: string;
  fullName: string;
  icNumber: string | null;
  dob: string | null;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  phoneNumber: string | null;
  createdAt: number;
  // ID document
  docType?: string | null;
  docFilePath?: string | null;
  docConfidence?: number | null;
  docFullName?: string | null;
  docDob?: string | null;
  docNationality?: string | null;
  docAddress?: string | null;
  // Face
  selfiePath?: string | null;
  faceMatchScore?: number | null;
}

interface ClientRecord extends BaseRecord {
  role: 'user' | 'client';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  // advisor fields null
  companyName?: null;
  licenseNumber?: null;
  approvedByAdmin?: null;
  approvedAt?: null;
  rejectionReason?: null;
}

interface AdvisorRecord extends BaseRecord {
  role: 'advisor';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  companyName: string | null;
  licenseNumber: string | null;
  approvedByAdmin: boolean | null;
  approvedAt: number | null;
  rejectionReason: string | null;
}

type ClientAdvisor = ClientRecord | AdvisorRecord;

type StatusTab = 'pending' | 'verified' | 'rejected';
type RoleTab = 'all' | 'client' | 'advisor';

// ─── API Fetches ──────────────────────────────────────────────────────────────

async function fetchRegistrations(status: string, page: number) {
  const params = new URLSearchParams({ page: String(page), status, limit: '20' });
  const res = await fetch(`${API_BASE}/api/admin/registrations?${params}`, { credentials: 'include' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch');
  return json as { registrations: ClientAdvisor[]; pagination: { page: number; limit: number; total: number; pages: number } };
}

async function fetchAdvisors(filter: string) {
  const res = await fetch(`${API_BASE}/api/admin/advisors?filter=${filter}`, { credentials: 'include' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch');
  return json.advisors as ClientAdvisor[];
}

async function approveUser(userId: string) {
  // Try client approve first, fall back to advisor approve
  const res = await fetch(`${API_BASE}/api/admin/registrations/${userId}/approve`, {
    method: 'POST', credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    // Try advisor endpoint
    const r2 = await fetch(`${API_BASE}/api/admin/advisors/${userId}/approve`, {
      method: 'POST', credentials: 'include',
    });
    const j2 = await r2.json();
    if (!j2.success) throw new Error(j2.error || 'Failed to approve');
    return j2;
  }
  return json;
}

async function rejectUser(userId: string, reason: string, role: string) {
  const endpoint = role === 'advisor'
    ? `${API_BASE}/api/admin/advisors/${userId}/reject`
    : `${API_BASE}/api/admin/registrations/${userId}/reject`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to reject');
  return json;
}

async function editRegistration(clientId: string, fields: Record<string, string>) {
  const res = await fetch(`${API_BASE}/api/admin/registrations/${clientId}/edit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save edits');
  return json;
}

async function logoutAdmin() {
  await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  window.location.href = '/login';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-gray-400 text-xs">No score</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'text-green-600 bg-green-50' : pct >= 70 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      <Percent className="w-3 h-3" />{pct}%
    </span>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5 break-words">{value || <span className="text-gray-400 italic">Not available</span>}</p>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ rec, onClose }: { rec: ClientAdvisor; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'info' | 'documents' | 'activity'>('info');
   const [showDetail, setShowDetail] = useState(false);
   const [editing, setEditing] = useState(false);
   const [editFields, setEditFields] = useState<Record<string, string>>({
     fullName: rec.fullName,
     icNumber: rec.icNumber || '',
     gender: rec.gender || '',
     age: rec.age != null ? String(rec.age) : '',
     nationality: rec.nationality || '',
     address: rec.docAddress || '',
   });
  const [rejectReason, setRejectReason] = useState('');
   const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectErr, setRejectErr] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState('');

  const isAdvisor = rec.role === 'advisor';
  const isPending = rec.verificationStatus === 'pending';

  const { data: logs } = useQuery({
    queryKey: ['client-audit', rec.clientId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/audit/${rec.clientId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.logs as Array<{ id: string; action: string; resource: string; createdAt: number; actorEmail: string }>;
    },
  });

  function handleEditChange(field: string, value: string) {
    setEditFields(prev => ({ ...prev, [field]: value }));
  }

  async function handleSaveEdit() {
    setSavingEdit(true);
    setEditErr('');
    try {
      await editRegistration(rec.clientId, editFields);
       setShowDetail(false);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
    } catch (e: unknown) {
      setEditErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  }

  const approveMutation = useMutation({
    mutationFn: () => approveUser(rec.userId),
    onSuccess: () => {
      toast.success('Approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      onClose();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectUser(rec.userId, rejectReason, rec.role),
    onSuccess: () => {
      toast.success('Rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      onClose();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });

   const ACTION_LABELS: Record<string, string> = {
    login: 'Logged In', create: 'Created',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{rec.fullName}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                rec.role === 'advisor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {rec.role === 'advisor' ? 'Advisor' : 'Client'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{rec.email}</p>
            <span className="inline-block mt-1 font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {rec.referenceId}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              rec.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              rec.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <Clock className="w-3 h-3" /> {rec.verificationStatus}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 border-b px-6 pt-4">
          {(['info', 'documents', 'activity'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 border border-gray-200 border-b-white -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Info Tab ── */}
          {tab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Profile + editable fields */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Profile Details</h3>
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', field: 'fullName', type: 'text' },
                    { label: 'IC Number', field: 'icNumber', type: 'text' },
                    { label: 'Date of Birth', field: 'dob', type: 'date' },
                    { label: 'Gender', field: 'gender', type: 'text' },
                    { label: 'Age', field: 'age', type: 'number' },
                    { label: 'Nationality', field: 'nationality', type: 'text' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
                      <input type={type} value={editFields[field as keyof typeof editFields]}
                        onChange={e => handleEditChange(field, e.target.value)}
                        readOnly={!editing}
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500' : 'border-gray-200 bg-gray-50 text-gray-600'}`} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</label>
                    <textarea value={editFields.address} rows={2}
                      onChange={e => handleEditChange('address', e.target.value)}
                      readOnly={!editing}
                      className={`w-full border rounded-lg px-3 py-2 text-sm resize-none ${editing ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500' : 'border-gray-200 bg-gray-50 text-gray-600'}`} />
                  </div>
                </div>
                {editing && (
                  <button onClick={handleSaveEdit} disabled={savingEdit}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm">
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
                {editErr && <p className="mt-2 text-sm text-red-600">{editErr}</p>}
              </div>

              {/* Right: Advisor extras + actions */}
              <div className="space-y-4">
                {/* Advisor-specific fields */}
                {isAdvisor && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-purple-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Advisor Details
                    </h3>
                    <div className="space-y-1">
                      <DetailRow icon={Building2} label="Company Name" value={(rec as AdvisorRecord).companyName} />
                      <DetailRow icon={Hash} label="License Number" value={(rec as AdvisorRecord).licenseNumber} />
                    </div>
                  </div>
                )}

                {/* Face verification score */}
                {(rec.faceMatchScore != null || rec.selfiePath) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Face Verification</h3>
                    <div className="flex items-center gap-3">
                      <Percent className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Match Score</p>
                        <ConfidenceBadge score={rec.faceMatchScore} />
                      </div>
                    </div>
                    {(rec as AdvisorRecord).rejectionReason && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-red-600">Rejection Reason</p>
                        <p className="text-sm text-red-700">{(rec as AdvisorRecord).rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                    {!showRejectForm ? (
                      <div className="flex gap-3">
                        <button onClick={() => approveMutation.mutate()}
                          disabled={approveMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm">
                          {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </button>
                        <button onClick={() => setShowRejectForm(true)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rejection Reason</label>
                        <textarea value={rejectReason} onChange={e => { setRejectReason(e.target.value); setRejectErr(''); }}
                          rows={3} placeholder="Explain why..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-2" />
                        {rejectErr && <p className="text-sm text-red-600 mb-2">{rejectErr}</p>}
                        <div className="flex gap-3">
                          <button onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm">
                            Cancel
                          </button>
                          <button onClick={() => rejectMutation.mutate()}
                            disabled={rejectMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium text-sm">
                            {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Confirm Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Documents Tab ── */}
          {tab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Document */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">ID Document</span>
                </div>
                {rec.docFilePath ? (
                  <div className="p-4 flex justify-center">
                    <img src={rec.docFilePath} alt="ID Document"
                      className="max-h-72 rounded-lg object-contain border border-gray-200" />
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm">No ID document</p>
                  </div>
                )}
                <div className="px-4 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">OCR Confidence</span>
                    <ConfidenceBadge score={rec.docConfidence} />
                  </div>
                  {rec.docAddress && (
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-700">{rec.docAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-indigo-900">Selfie</span>
                </div>
                {rec.selfiePath ? (
                  <div className="p-4 flex justify-center">
                    <img src={rec.selfiePath} alt="Selfie"
                      className="max-h-72 rounded-lg object-contain border border-gray-200" />
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm">No selfie</p>
                  </div>
                )}
                {rec.faceMatchScore != null && (
                  <div className="px-4 pb-3">
                    <span className="text-xs text-gray-500">Face Match Score</span>
                    <div className="mt-1"><ConfidenceBadge score={rec.faceMatchScore} /></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Activity Tab ── */}
          {tab === 'activity' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>
              {!logs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="mt-0.5">
                        {log.action === 'approve' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {log.action === 'reject' && <XCircle className="w-4 h-4 text-red-600" />}
                        {log.action === 'update' && <Pencil className="w-4 h-4 text-blue-600" />}
                        {log.action === 'login' && <LogIn className="w-4 h-4 text-indigo-600" />}
                        {!['approve', 'reject', 'update', 'login'].includes(log.action) && <Clock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ACTION_LABELS[log.action] || log.action}</p>
                        <p className="text-xs text-gray-400">{log.resource}</p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(log.createdAt * 1000).toLocaleString('en-MY', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminRegistrationsPage() {
  const queryClient = useQueryClient();
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [page, setPage] = useState(1);
   const [selected, setSelected] = useState<ClientAdvisor | null>(null);

  // Fetch registrations (covers all roles)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-registrations', statusTab, page],
    queryFn: () => fetchRegistrations(statusTab, page),
  });

  // Fetch advisors separately (has richer fields)
  const { data: advisorData } = useQuery({
    queryKey: ['admin-advisors', statusTab],
    queryFn: () => fetchAdvisors(statusTab),
    enabled: roleTab !== 'client',
  });

  // Merge: use advisor data for advisors (richer), registrations data for clients
  const allRecords: ClientAdvisor[] = (() => {
    const regs = data?.registrations || [];
    const advisors = advisorData || [];
    const advisorMap = new Map(advisors.map(a => [a.userId, a]));
    // Merge: replace advisor entries with richer advisor data
    return regs.map(r => advisorMap.get(r.userId) || r);
  })();

  const filteredRecords = roleTab === 'all' ? allRecords
    : roleTab === 'advisor' ? allRecords.filter(r => r.role === 'advisor')
    : allRecords.filter(r => r.role !== 'advisor');

  const pagination = data?.pagination;
  const records = filteredRecords;

  const approveMutation = useMutation({
    mutationFn: (r: ClientAdvisor) => approveUser(r.userId),
    onSuccess: () => {
      toast.success('Registration approved!');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-advisors'] });
      setSelected(null);
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });

  const rejectMutation = useMutation({
     mutationFn: ({ r, reason }: { r: ClientAdvisor; reason: string }) => rejectUser(r.userId, reason, r.role),
    onSuccess: () => {
      toast.success('Registration rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-advisors'] });
      setSelected(null);
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });

  function handleRowClick(r: ClientAdvisor) {
    setSelected(r);
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">CFP Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Registration Approvals</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-indigo-600 text-white font-medium text-sm">
            <Users className="w-4 h-4" /> All Registrations
          </a>
          <a href="/admin/audit"
            className="flex items-center gap-2 px-4 py-2.5 rounded text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition">
            <Shield className="w-4 h-4" /> Audit Log
          </a>
        </nav>
        <button onClick={logoutAdmin}
          className="flex items-center gap-2 px-4 py-2.5 rounded hover:bg-red-600 transition text-sm text-red-300 hover:text-white mt-auto">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Registrations</h2>
          <p className="text-gray-500 text-sm mt-1">Review and approve client and advisor registrations</p>
        </div>

        {/* Role + Status tabs */}
        <div className="space-y-3 mb-6">
          {/* Role filter */}
          <div className="flex gap-1 bg-gray-200 border border-gray-300 rounded-lg p-1 w-fit">
            {([['all', 'All'], ['client', 'Clients'], ['advisor', 'Advisors']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setRoleTab(val); setPage(1); setSelected(null); }}
                className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition ${roleTab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {label}
              </button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-1 bg-gray-200 border border-gray-300 rounded-lg p-1 w-fit">
            {(['pending', 'verified', 'rejected'] as const).map(t => (
              <button key={t} onClick={() => { setStatusTab(t); setPage(1); setSelected(null); }}
                className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition ${statusTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3 px-6 py-12 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error instanceof Error ? error.message : 'Something went wrong'}</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-20 text-gray-400">
              <Clock className="w-10 h-10" />
              <p className="font-medium text-gray-600">No {statusTab} {roleTab === 'all' ? '' : roleTab + 's'}</p>
            </div>
          ) : (
            <>
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Reference ID', 'Name / Email', 'IC Number', 'DOB', 'Nationality', 'Role', 'Submitted', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => (
                    <tr key={r.userId}
                      onClick={() => handleRowClick(r)}
                      className="hover:bg-indigo-50 cursor-pointer transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded whitespace-nowrap">
                          {r.referenceId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{r.fullName}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono whitespace-nowrap">{r.icNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{r.dob ? r.dob.split('T')[0] : '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{r.nationality || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${r.role === 'advisor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.role === 'advisor' ? 'Advisor' : 'Client'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt * 1000).toLocaleDateString('en-MY') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          r.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {r.verificationStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {r.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3" />}
                          {r.verificationStatus === 'rejected' && <XCircle className="w-3 h-3" />}
                          {r.verificationStatus.charAt(0).toUpperCase() + r.verificationStatus.slice(1)}
                        </span>
                      </td>
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
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selected && (
        <DetailModal rec={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
