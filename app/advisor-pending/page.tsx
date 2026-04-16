'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Loader2, CheckCircle } from 'lucide-react';

export default function AdvisorPendingPage() {
  const router = useRouter();

  // Poll — if approved, redirect to advisor dashboard
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const json = await res.json();
        if (json.user?.role === 'advisor' && json.user?.approvedByAdmin) {
          clearInterval(interval);
          router.push('/dashboard/overview');
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Under Review</h1>
        <p className="text-gray-600 mb-2">
          Your advisor application has been submitted and is pending <strong>admin approval</strong>.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You&apos;ll be notified once your account is approved. This page will automatically redirect when ready.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Waiting for approval...
        </div>
      </div>
    </div>
  );
}
