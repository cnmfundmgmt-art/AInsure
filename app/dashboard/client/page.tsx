'use client';

import { useState, useEffect } from 'react';

type AdvisorClient = {
  id: string;
  clientNumber: string;
  advisorId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  nricPassport: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  addressState: string | null;
  preferredLanguage: string;
  notes: string | null;
  gender?: string;
  createdAt: number;
  updatedAt: number;
};

type FormData = {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nricPassport: string;
  addressStreet: string;
  addressCity: string;
  addressPostcode: string;
  addressState: string;
  preferredLanguage: string;
  notes: string;
};

const emptyForm: FormData = {
  firstName: '', lastName: '', gender: '', email: '', phone: '',
  dateOfBirth: '', nricPassport: '', addressStreet: '',
  addressCity: '', addressPostcode: '', addressState: '',
  preferredLanguage: 'EN', notes: '',
};

const LANGUAGE_LABELS: Record<string, string> = { EN: 'English', MS: 'Malay', ZH: 'Chinese' };
const STATE_LABELS: Record<string, string> = {
  'Johor': 'Johor', 'Kedah': 'Kedah', 'Kelantan': 'Kelantan',
  'Melaka': 'Melaka', 'Negeri Sembilan': 'Negeri Sembilan', 'Pahang': 'Pahang',
  'Perak': 'Perak', 'Perlis': 'Perlis', 'Sabah': 'Sabah',
  'Sarawak': 'Sarawak', 'Selangor': 'Selangor', 'Terengganu': 'Terengganu',
  'WP Kuala Lumpur': 'WP Kuala Lumpur', 'WP Labuan': 'WP Labuan', 'WP Putrajaya': 'WP Putrajaya',
};

async function seedDummyClients() {
  const dummyClients = [
    { firstName: 'Ahmad', lastName: 'Razali', gender: 'Male', email: 'ahmad.razali@email.com', phone: '012-3456789', dateOfBirth: '1985-03-15', preferredLanguage: 'MS', notes: 'Interested in investment-linked products. Has 2 dependents.', addressCity: 'Kuala Lumpur', addressState: 'WP Kuala Lumpur' },
    { firstName: 'Siti', lastName: 'Nurhaliza', gender: 'Female', email: 'siti.nurhaliza@email.com', phone: '017-2345678', dateOfBirth: '1990-07-22', preferredLanguage: 'MS', notes: 'New mother, looking for child education plan.', addressCity: 'Shah Alam', addressState: 'Selangor' },
    { firstName: 'David', lastName: 'Chen', gender: 'Male', email: 'david.chen@email.com', phone: '016-9876543', dateOfBirth: '1978-11-08', preferredLanguage: 'ZH', notes: 'Business owner, high risk tolerance. Focus on wealth accumulation.', addressCity: 'Penang', addressState: 'Penang' },
    { firstName: 'Priya', lastName: 'Sharma', gender: 'Female', email: 'priya.sharma@email.com', phone: '011-12345678', dateOfBirth: '1992-05-30', preferredLanguage: 'EN', notes: 'Single, young professional. Starting to build emergency fund.', addressCity: 'Johor Bahru', addressState: 'Johor' },
    { firstName: 'Muhammad', lastName: 'Faiz', gender: 'Male', email: 'faiz.muhd@email.com', phone: '013-4567890', dateOfBirth: '1988-01-12', preferredLanguage: 'MS', notes: 'Married with 3 kids. Priority: family protection & education savings.', addressCity: 'Kota Kinabalu', addressState: 'Sabah' },
  ];

  for (const c of dummyClients) {
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(c),
    });
  }
}

export default function ClientManagementPage() {
  const [clients, setClients] = useState<AdvisorClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    await seedDummyClients();
    await fetchClients();
    setSeeding(false);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(c: AdvisorClient) {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName, lastName: c.lastName,
      gender: (c as AdvisorClient & { gender?: string }).gender || '',
      email: c.email || '', phone: c.phone || '',
      dateOfBirth: c.dateOfBirth || '', nricPassport: c.nricPassport || '',
      addressStreet: c.addressStreet || '', addressCity: c.addressCity || '',
      addressPostcode: c.addressPostcode || '', addressState: c.addressState || '',
      preferredLanguage: c.preferredLanguage || 'EN',
      notes: c.notes || '',
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client?')) return;
    const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) fetchClients();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/clients?id=${editingId}` : '/api/clients';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setShowModal(false); fetchClients(); }
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return c.firstName.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  function getAvatar(gender?: string) {
    if (gender === 'Male') return '👨';
    if (gender === 'Female') return '👩';
    return '👤';
  }

  function getInitials(first: string, last: string) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  const langBadge: Record<string, string> = { EN: 'bg-blue-100 text-blue-700', MS: 'bg-green-100 text-green-700', ZH: 'bg-red-100 text-red-700' };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-gray-900 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {clients.length === 0 && !loading && (
            <button onClick={handleSeed} disabled={seeding}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
              {seeding ? 'Adding...' : '+ Add Sample Clients'}
            </button>
          )}
          <button onClick={openAdd}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
            + Add Client
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-900">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {clients.length > 0 && (
            <div className="mb-4">
              <input type="search" placeholder="Search by name, email or phone..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border border-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-900 mb-4">
                {search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
              </p>
              {!search && (
                <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
                  + Add Client
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => {
                const gender = (c as AdvisorClient & { gender?: string }).gender;
                return (
                  <div key={c.id} className="bg-white border border-gray-900 rounded-xl p-5 hover:shadow-md transition cursor-pointer group"
                    onClick={() => openEdit(c)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                        {getAvatar(gender)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-mono">{c.clientNumber}</div>
                        <h3 className="font-bold text-gray-900 truncate">{c.firstName} {c.lastName}</h3>
                        <p className="text-xs text-gray-900">{gender || 'Not specified'}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition">Delete</button>
                    </div>

                    <div className="space-y-1.5 text-sm mb-3">
                      {c.email && <div className="flex items-center gap-2 text-gray-900 truncate"><span className="text-gray-900">✉</span> {c.email}</div>}
                      {c.phone && <div className="flex items-center gap-2 text-gray-900"><span className="text-gray-900">📞</span> {c.phone}</div>}
                      {c.dateOfBirth && <div className="flex items-center gap-2 text-gray-900"><span className="text-gray-900">🎂</span> {c.dateOfBirth}</div>}
                      {c.nricPassport && <div className="flex items-center gap-2 text-gray-900"><span className="text-gray-900">🪪</span> {c.nricPassport.replace(/.(?=.{4})/g, '*')}</div>}
                      {c.addressCity && <div className="flex items-center gap-2 text-gray-900 truncate"><span className="text-gray-900">📍</span> {c.addressCity}{c.addressState ? `, ${STATE_LABELS[c.addressState] || c.addressState}` : ''}</div>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${langBadge[c.preferredLanguage] || 'bg-gray-100 text-gray-900'}`}>
                        {LANGUAGE_LABELS[c.preferredLanguage] || c.preferredLanguage}
                      </span>
                      {c.notes && (
                        <span className="text-xs text-gray-900 truncate max-w-[120px]" title={c.notes}>💬 {c.notes.substring(0, 20)}...</span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-900">Added {new Date(c.createdAt * 1000).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-900 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-900 hover:text-gray-900">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">First Name *</label>
                  <input required value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Last Name *</label>
                  <input required value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">Gender</label>
                <div className="flex gap-4">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="gender" value={g} checked={form.gender === g}
                        onChange={e => handleChange('gender', e.target.value)}
                        className="accent-indigo-600" />
                      <span className="text-gray-900">{g === 'Male' ? '👨 Male' : '👩 Female'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">NRIC / Passport</label>
                  <input value={form.nricPassport} onChange={e => handleChange('nricPassport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">Street Address</label>
                <input value={form.addressStreet} onChange={e => handleChange('addressStreet', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">City</label>
                  <input value={form.addressCity} onChange={e => handleChange('addressCity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">Postcode</label>
                  <input value={form.addressPostcode} onChange={e => handleChange('addressPostcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1">State</label>
                  <select value={form.addressState} onChange={e => handleChange('addressState', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Select state</option>
                    {Object.entries(STATE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">Preferred Language</label>
                <div className="flex gap-4">
                  {[['EN', '🇬🇧 English'], ['MS', '🇲🇾 Malay'], ['ZH', '🇨🇳 Chinese']].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="preferredLanguage" value={val} checked={form.preferredLanguage === val}
                        onChange={e => handleChange('preferredLanguage', e.target.value)}
                        className="accent-indigo-600" />
                      <span className="text-gray-900">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">Notes</label>
<textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-gray-900 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Additional notes about this client..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-900">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editingId ? 'Update Client' : 'Add Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}