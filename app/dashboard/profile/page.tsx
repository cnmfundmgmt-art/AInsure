'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Edit2, Save, Phone, Briefcase, Heart } from 'lucide-react';

async function fetchProfile() {
  const res = await fetch('/api/client/profile', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

async function fetchStatus() {
  const res = await fetch('/api/client/status', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

async function updateProfile(data: Record<string, unknown>) {
  const res = await fetch('/api/client/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update profile');
  }
  return res.json();
}

const INCOME_RANGES = [
  { value: '', label: 'Select range' },
  { value: '0-50000', label: 'Less than RM50,000' },
  { value: '50000-100000', label: 'RM50,000 – RM100,000' },
  { value: '100000-150000', label: 'RM100,000 – RM150,000' },
  { value: '150000-200000', label: 'RM150,000 – RM200,000' },
  { value: '200000+', label: 'More than RM200,000' },
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    marital_status: '',
    dependents: 0,
    employment_status: '',
    occupation: '',
    employer: '',
    annual_income: '',
    phone_number: '',
  });

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    retry: 1,
  });

  const { data: status, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['profile-status'],
    queryFn: fetchStatus,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-status'] });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        marital_status: profile.maritalStatus || '',
        dependents: profile.dependents ?? 0,
        employment_status: profile.employmentStatus || '',
        occupation: profile.occupation || '',
        employer: profile.employer || '',
        annual_income: profile.annualIncome != null ? String(profile.annualIncome) : '',
        phone_number: profile.phoneNumber || '',
      });
    }
  }, [profile, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(formData)) {
      if (v !== '' && v !== 0) payload[k] = v;
    }
    updateMutation.mutate(payload);
  };

  if (profileLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (profileError || statusError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to load profile.</p>
          <p className="text-gray-500 text-sm mt-1">Please refresh the page or log in again.</p>
        </div>
      </div>
    );
  }

  const verified = profile?.verificationStatus === 'verified';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and KYC status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main: Profile Forms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Verified Information */}
          <div className={`rounded-xl border p-6 ${verified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">Verified Information</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${verified ? 'text-green-700 bg-green-100 border-green-200' : 'text-yellow-700 bg-yellow-100 border-yellow-200'}`}>
                {verified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {verified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: profile?.fullName || '—' },
                {
                  label: 'IC / Passport',
                  value: profile?.icNumber ? `****-${profile.icNumber.slice(-6)}` : '—',
                },
                { label: 'Date of Birth', value: profile?.dob || '—' },
                { label: 'Nationality', value: profile?.nationality || 'Malaysian' },
                { label: 'Email', value: profile?.email || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-black font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editable Additional Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-black">Additional Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Heart className="w-4 h-4 text-gray-400" />
                  Marital Status
                </label>
                <select
                  value={formData.marital_status}
                  onChange={e => setFormData(p => ({ ...p, marital_status: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black transition"
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Dependents</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={formData.dependents}
                  onChange={e => setFormData(p => ({ ...p, dependents: parseInt(e.target.value) || 0 }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black transition"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  Employment Status
                </label>
                <select
                  value={formData.employment_status}
                  onChange={e => setFormData(p => ({ ...p, employment_status: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black transition"
                >
                  <option value="">Select</option>
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={e => setFormData(p => ({ ...p, occupation: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black placeholder-gray-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employer</label>
                <input
                  type="text"
                  value={formData.employer}
                  onChange={e => setFormData(p => ({ ...p, employer: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="e.g., ABC Corporation"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black placeholder-gray-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Income (RM)</label>
                <select
                  value={formData.annual_income}
                  onChange={e => setFormData(p => ({ ...p, annual_income: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black transition"
                >
                  {INCOME_RANGES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={e => setFormData(p => ({ ...p, phone_number: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="0123456789"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-black placeholder-gray-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Malaysian format: 01X-XXXXXXX</p>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* KYC Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-black mb-4">KYC Status</h3>
            <div className="space-y-3">
              {[
                { label: 'ID Uploaded', done: status?.id_uploaded },
                { label: 'Face Verified', done: status?.face_verified },
                { label: 'Admin Verified', done: status?.admin_verified },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  {done ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-black mb-4">Profile Completion</h3>
            <div className="mb-2">
              <span className="text-2xl font-bold text-indigo-600">
                {status?.profile_completion_percentage ?? 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${status?.profile_completion_percentage ?? 0}%` }}
              />
            </div>
            {status?.missing_fields?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Missing:</p>
                <ul className="space-y-1">
                  {status.missing_fields.map((f: string) => (
                    <li key={f} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full inline-block" />
                      {f.replace(/([A-Z])/g, ' $1').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Verification Timeline */}
          {profile?.verification_timeline && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-black mb-4">Verification Timeline</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium text-black">
                    {new Date(profile.verification_timeline.created_at * 1000).toLocaleDateString('en-MY', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                {profile.verification_timeline.verified_at && (
                  <div>
                    <p className="text-gray-500">Verified</p>
                    <p className="font-medium text-green-700">
                      {new Date(profile.verification_timeline.verified_at * 1000).toLocaleDateString('en-MY', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
