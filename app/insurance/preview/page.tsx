'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  User, DollarSign, Users, Heart, Stethoscope, FileText, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ClientData {
  name: string;
  icNumber: string;
  dob: string;
  age: number;
  gender: string;
  income: number;
  budget: number;
  dependents: number;
  goals: string;
  existingPolicies: Array<{ policyType: string; sumAssured: number; premium: number }>;
  // New fields
  smoker?: boolean;
  nationality?: string;
  coverageTerm?: string;
  savingsType?: string;
  hospitalWard?: string;
  occupation?: string;
  existingLifeCover?: number;
  existingCICover?: number;
  existingMedicalCover?: number;
}

function fmt(n: number) {
  return 'RM' + n.toLocaleString('en-MY');
}

function fmtBudget(n: number) {
  return 'RM' + n.toLocaleString('en-MY') + '/mo';
}

export default function InsurancePreview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Demo client data — in real flow this would come from the intake form
  const client: ClientData = {
    name: 'ABD RAUF ells HAMSAH',
    icNumber: '460619-12-5087',
    dob: '06/19/1946',
    age: 50,
    gender: 'Male',
    income: 100000,
    budget: 1000,
    dependents: 1,
    goals: 'Education, Family Protection',
    existingPolicies: [],
    smoker: false,
    nationality: 'Malaysian',
    coverageTerm: 'Up to age 80',
    savingsType: 'Protection only (No investment)',
    hospitalWard: 'Private ward',
    occupation: 'Professional',
    existingLifeCover: 0,
    existingCICover: 0,
    existingMedicalCover: 0,
  };

  const lifeRequired = client.income * 8;
  const ciRequired = Math.max(client.income * 3, 150000);
  const medicalRequired = 1000000;

  const lifeGap = Math.max(0, lifeRequired - (client.existingLifeCover || 0));
  const ciGap = Math.max(0, ciRequired - (client.existingCICover || 0));
  const medicalGap = Math.max(0, medicalRequired - (client.existingMedicalCover || 0));

  const handleAnalyze = async () => {
    if (!confirmed) {
      toast.error('Please confirm the details are accurate before proceeding.');
      return;
    }
    setLoading(true);
    // In real flow: POST to /api/insurance/analyze then redirect to insurance page with sessionId
    setTimeout(() => {
      toast.success('Analysis complete!');
      router.push('/insurance');
    }, 2000);
  };

  const totalExistingPremium = client.existingPolicies.reduce((s, p) => s + p.premium, 0);
  const newPremiumMonthly = client.budget;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Client Analysis Preview</h1>
            <p className="text-xs text-gray-500">Verify details before generating recommendations</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Personal Details */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Personal Details</h2>
              <Link href="/insurance" className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Edit
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Full Name</span>
                <span className="font-medium text-gray-900">{client.name}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">IC Number</span>
                <span className="font-medium text-gray-900 font-mono text-sm">{client.icNumber}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Date of Birth</span>
                <span className="font-medium text-gray-900">{client.dob}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Age / Gender</span>
                <span className="font-medium text-gray-900">{client.age} yrs · {client.gender}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Dependents</span>
                <span className="font-medium text-indigo-600">{client.dependents}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Nationality</span>
                <span className="font-medium text-gray-900">{client.nationality}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Occupation</span>
                <span className="font-medium text-gray-900">{client.occupation}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Smoker</span>
                <span className={`font-medium ${client.smoker ? 'text-rose-600' : 'text-green-600'}`}>
                  {client.smoker ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Profile */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Financial Profile</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {fmt(client.income)}/yr
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Annual Income</span>
                <span className="font-semibold text-green-700">{fmt(client.income)}/yr</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Monthly Budget</span>
                <span className="font-semibold text-gray-900">{fmtBudget(client.budget)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Existing Premium</span>
                <span className="font-medium text-gray-500">{totalExistingPremium > 0 ? fmt(totalExistingPremium) + '/yr' : '—'}</span>
              </div>
            </div>
          </div>

          {/* Existing Coverage */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Existing Coverage</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Life Cover', value: client.existingLifeCover || 0, color: 'blue' },
                { label: 'CI Cover', value: client.existingCICover || 0, color: 'rose' },
                { label: 'Medical', value: client.existingMedicalCover || 0, color: 'amber' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl border ${value > 0 ? `border-${color}-200 bg-${color}-50` : 'border-gray-200 bg-gray-50'}`}>
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${value > 0 ? `text-${color}-700` : 'text-gray-400'}`}>
                      {value > 0 ? fmt(value) : 'None'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Preferences */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Coverage Preferences</h2>
            <div className="flex flex-wrap gap-2">
              {[
                client.coverageTerm && <span key="term" className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5">📅 {client.coverageTerm}</span>,
                client.savingsType && <span key="savings" className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5">💰 {client.savingsType}</span>,
                client.hospitalWard && <span key="ward" className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5">🏥 {client.hospitalWard}</span>,
                client.goals && <span key="goals" className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5">🎯 {client.goals}</span>,
              ].filter(Boolean)}
            </div>
          </div>

          {/* Calculated Protection Gaps */}
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Calculated Protection Gaps</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Life', amount: lifeGap, sub: `${fmt(lifeRequired)} required · 8× income`, color: 'indigo' },
                { label: 'Critical Illness', amount: ciGap, sub: `${fmt(ciRequired)} required · 3× income`, color: 'rose' },
                { label: 'Medical / Hospital', amount: medicalGap, sub: `${fmt(medicalRequired)} required · RM1M min`, color: 'amber' },
              ].map(({ label, amount, sub, color }) => (
                <div key={label} className={`rounded-xl border border-${color}-200 bg-${color}-50 px-4 py-3 text-center`}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-lg font-bold text-${color}-700`}>{fmt(amount)}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="px-5 py-4 bg-green-50 border-t border-green-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer"
              />
              <span className="text-xs text-green-800 leading-relaxed">
                I confirm the details above are accurate. The AI will generate insurance recommendations based on this profile.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 flex gap-3 bg-gray-50 border-t border-gray-100">
            <Link href="/insurance" className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <ChevronLeft className="w-4 h-4" /> Back to Edit
            </Link>
            <button
              onClick={handleAnalyze}
              disabled={!confirmed || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              ) : (
                <>Generate Analysis <ChevronLeft className="w-4 h-4 rotate-180" /></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Data shown is for demonstration purposes · Preview only
        </p>
      </div>
    </div>
  );
}