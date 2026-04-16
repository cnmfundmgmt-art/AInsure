'use client';

import { useQuery } from '@tanstack/react-query';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Shield, Clock, DollarSign } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

type Profile = {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  monthly_surplus: number;
  emergency_fund_months: number;
  debt_to_income_ratio: number;
  latest_snapshot: { monthly_income: number; monthly_expenses: number; emergency_fund: number } | null;
  assets: { asset_type: string; name: string; value: number }[];
  liabilities: { liability_type: string; name: string; amount: number; interest_rate: number | null }[];
};

const ASSET_LABELS: Record<string, string> = {
  cash: 'Cash & Savings', property: 'Property', equity: 'Stocks & Equity',
  fixed_income: 'Fixed Income', crypto: 'Crypto', retirement: 'EPF/Retirement', others: 'Others',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(n);
}

function ScoreCard({ icon: Icon, label, score, max, color }: {
  icon: React.ElementType; label: string; score: number; max: number; color: string;
}) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{pct}</span>
        <span className="text-sm text-gray-500 mb-0.5">/ 100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color.replace('bg-', 'bg-').replace('-100', '-500')}`}
          style={{ width: pct + '%', background: pct > 80 ? '#10b981' : pct > 50 ? '#f59e0b' : '#ef4444' }} />
      </div>
    </div>
  );
}

function HealthBadge({ score }: { score: number }) {
  if (score >= 80) return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
      <CheckCircle className="w-6 h-6 text-green-600" />
      <div><p className="font-bold text-green-800">Excellent Financial Health</p><p className="text-sm text-green-600">Your finances are in great shape!</p></div>
    </div>
  );
  if (score >= 60) return (
    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <AlertTriangle className="w-6 h-6 text-yellow-600" />
      <div><p className="font-bold text-yellow-800">Good — Room to Improve</p><p className="text-sm text-yellow-600">A few areas need attention.</p></div>
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
      <XCircle className="w-6 h-6 text-red-600" />
      <div><p className="font-bold text-red-800">Needs Attention</p><p className="text-sm text-red-600">Take action to improve your financial health.</p></div>
    </div>
  );
}

export default function AnalysisPage() {
  const { data, isLoading, error } = useQuery<Profile>({
    queryKey: ['analysis-profile'],
    queryFn: () => fetch(`${API}/api/financial/profile`).then(r => r.json()),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-16 text-gray-500">
      <p>Failed to load financial data. Please try again.</p>
    </div>
  );

  const {
    total_assets, total_liabilities, net_worth, monthly_surplus,
    emergency_fund_months, debt_to_income_ratio, latest_snapshot, assets, liabilities,
  } = data;

  // ── Scores ──────────────────────────────────────────────────────────────
  const emergencyScore = Math.min(emergency_fund_months / 6 * 100, 100); // 6mo = 100
  const surplusScore = monthly_surplus > 0 ? Math.min(monthly_surplus / (latest_snapshot?.monthly_income || 1) * 100, 100) : 0;
  const debtScore = debt_to_income_ratio <= 0.5 ? 100 : debt_to_income_ratio <= 1 ? 70 : debt_to_income_ratio <= 2 ? 40 : 0;
  const netWorthScore = net_worth > 0 ? Math.min(net_worth / ((latest_snapshot?.monthly_income || 1) * 12) * 20, 100) : 0;
  const overallScore = Math.round([emergencyScore, surplusScore, debtScore, netWorthScore].reduce((a, b) => a + b, 0) / 4);

  const radarData = [
    { subject: 'Emergency Fund', score: Math.round(emergencyScore), fullMark: 100 },
    { subject: 'Savings Rate', score: Math.round(surplusScore), fullMark: 100 },
    { subject: 'Debt Management', score: Math.round(debtScore), fullMark: 100 },
    { subject: 'Net Worth', score: Math.round(netWorthScore), fullMark: 100 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#6366f1', '#14b8a6'];

  const assetPie = Object.entries(ASSET_LABELS)
    .map(([k, label]) => ({ name: label, value: assets.filter(a => a.asset_type === k).reduce((s, a) => s + Number(a.value), 0) }))
    .filter(x => x.value > 0);

  const recommendations: { priority: 'high' | 'med' | 'low', text: string }[] = [];
  if (emergency_fund_months < 3) recommendations.push({ priority: 'high', text: `Build emergency fund to 3–6 months (currently ${emergency_fund_months}mo)` });
  if (monthly_surplus <= 0) recommendations.push({ priority: 'high', text: 'Reduce expenses to achieve positive monthly surplus' });
  if (debt_to_income_ratio > 1) recommendations.push({ priority: 'high', text: `High debt-to-income ratio (${debt_to_income_ratio}x) — prioritise debt reduction` });
  if (net_worth <= 0) recommendations.push({ priority: 'high', text: 'Focus on reducing liabilities to achieve positive net worth' });
  if (emergency_fund_months >= 3 && emergency_fund_months < 6) recommendations.push({ priority: 'med', text: `Consider topping up emergency fund to 6 months (currently ${emergency_fund_months.toFixed(1)}mo)` });
  if (debt_to_income_ratio > 0.5 && debt_to_income_ratio <= 1) recommendations.push({ priority: 'med', text: 'Monitor debt levels — still within acceptable range' });
  if (recommendations.length === 0) recommendations.push({ priority: 'low', text: 'Great job! Maintain your current financial discipline' });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Health Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">Based on your financial snapshot</p>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3" strokeDasharray={`${overallScore} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{overallScore}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Overall Score</p>
            <HealthBadge score={overallScore} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard icon={Clock} label="Emergency Fund" score={emergency_fund_months} max={6} color="bg-blue-100 text-blue-600" />
          <ScoreCard icon={TrendingUp} label="Monthly Surplus" score={monthly_surplus} max={Math.max(latest_snapshot?.monthly_income || 1, 1)} color="bg-green-100 text-green-600" />
          <ScoreCard icon={Shield} label="Debt Ratio" score={100 - Math.min(debt_to_income_ratio * 40, 100)} max={100} color="bg-red-100 text-red-600" />
          <ScoreCard icon={DollarSign} label="Net Worth" score={Math.max(net_worth, 0)} max={(latest_snapshot?.monthly_income || 1) * 12} color="bg-purple-100 text-purple-600" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Financial Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Radar name="You" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Asset Allocation</h3>
          {assetPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={assetPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => percent != null && percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                  {assetPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No assets added yet</div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Recommendations</h3>
        <div className="space-y-2">
          {recommendations.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg ${r.priority === 'high' ? 'bg-red-50 border border-red-100' : r.priority === 'med' ? 'bg-yellow-50 border border-yellow-100' : 'bg-green-50 border border-green-100'}`}>
              <span className={`mt-0.5 ${r.priority === 'high' ? 'text-red-500' : r.priority === 'med' ? 'text-yellow-500' : 'text-green-500'}`}>
                {r.priority === 'high' ? '🔴' : r.priority === 'med' ? '🟡' : '🟢'}
              </span>
              <p className={`text-sm ${r.priority === 'high' ? 'text-red-800' : r.priority === 'med' ? 'text-yellow-800' : 'text-green-800'}`}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Net Worth', value: fmt(net_worth), color: net_worth >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Total Assets', value: fmt(total_assets), color: 'text-gray-900' },
            { label: 'Total Liabilities', value: fmt(total_liabilities), color: 'text-red-600' },
            { label: 'Monthly Surplus', value: fmt(monthly_surplus), color: monthly_surplus >= 0 ? 'text-green-600' : 'text-red-600' },
            { label: 'Emergency Fund', value: `${emergency_fund_months} months`, color: 'text-indigo-600' },
            { label: 'Debt-to-Income', value: `${debt_to_income_ratio}x`, color: debt_to_income_ratio > 1 ? 'text-red-600' : 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
