'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

async function fetchStatus() {
  const res = await fetch('/api/client/status', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function ProfileCompletionWidget() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['profile-status'],
    queryFn: fetchStatus,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (status?.overall_status === 'complete') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Profile Complete</p>
            <p className="text-xs text-green-600">Your profile is fully set up</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-800">Complete Your Profile</p>
          <p className="text-xs text-yellow-600 mt-0.5">
            {status?.profile_completion_percentage ?? 0}% complete
            {status?.missing_fields?.length > 0 && (
              <> — missing {status.missing_fields.join(', ')}</>
            )}
          </p>
          <Link
            href="/dashboard/profile"
            className="text-xs font-medium text-yellow-700 underline hover:text-yellow-900 mt-1 inline-block"
          >
            Add missing information →
          </Link>
        </div>
      </div>
    </div>
  );
}
