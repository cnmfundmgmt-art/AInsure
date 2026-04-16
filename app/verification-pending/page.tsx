'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Mail, Loader2, Hash } from 'lucide-react';

export default function VerificationPendingPage() {
  const [referenceId, setReferenceId] = useState('');

  useEffect(() => {
    const ref = sessionStorage.getItem('cfp_reference_id');
    if (ref) {
      setReferenceId(ref);
      sessionStorage.removeItem('cfp_reference_id');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-indigo-600" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Account Under Review</h1>
        <p className="text-gray-500 text-sm">
          Your ID and selfie have been submitted. Our team will verify your documents within <strong>2–4 hours</strong>.
        </p>

        {referenceId && (
          <div className="flex items-center justify-center gap-2 bg-indigo-50 rounded-xl px-5 py-3 border border-indigo-200">
            <Hash className="w-4 h-4 text-indigo-600" />
            <span className="font-mono font-semibold text-indigo-700">{referenceId}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 bg-indigo-50 rounded-xl px-5 py-4 text-indigo-700">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Estimated: 2–4 business hours</span>
        </div>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-left space-y-2">
          <p className="font-semibold text-gray-700 text-sm">What happens next?</p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">1. Our team reviews your ID document</li>
            <li className="flex items-start gap-2">2. We verify your selfie matches your ID</li>
            <li className="flex items-start gap-2">3. You will receive an email when approved</li>
            <li className="flex items-start gap-2">4. Log in to access your dashboard</li>
          </ol>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Mail className="w-4 h-4" />
          <span>We will email you at your registered address</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing your submission...</span>
        </div>
        <p className="text-sm text-gray-400">
          Need help? <Link href="mailto:support@cfp-malaysia.com" className="text-indigo-600 hover:underline">Contact support</Link>
        </p>
        <div className="border-t pt-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
