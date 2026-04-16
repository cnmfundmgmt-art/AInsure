'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, TrendingUp, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

async function fetchMe() {
  const res = await fetch('/api/client/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

async function fetchStatus() {
  const res = await fetch('/api/client/status', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function OverviewPage() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  const { data: status } = useQuery({ queryKey: ['profile-status'], queryFn: fetchStatus });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting()}, {me?.fullName || me?.email?.split('@')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here is your financial planning overview.</p>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'ID Uploaded', done: status?.id_uploaded, icon: User },
          { label: 'Face Verified', done: status?.face_verified, icon: CheckCircle },
          { label: 'Admin Approved', done: status?.admin_verified, icon: Clock },
        ].map(({ label, done, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Icon className={`w-5 h-5 ${done ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-yellow-600'}`}>
                {done ? 'Complete' : 'Pending'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { href: '/dashboard/profile', label: 'Complete Profile', desc: 'Add your employment, income & contact details', color: 'indigo' },
          { href: '/dashboard/analysis', label: 'View Analysis', desc: 'See your financial health analysis', color: 'blue' },
          { href: '/dashboard/products', label: 'Browse Products', desc: 'Explore investment & insurance products', color: 'purple' },
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-5 hover:bg-${color}-100 transition group`}>
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
            <p className={`text-xs font-medium text-${color}-600 mt-3 flex items-center gap-1 group-hover:underline`}>
              Go <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
