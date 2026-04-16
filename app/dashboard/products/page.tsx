'use client';

import { useState } from 'react';

const PRODUCTS = [
  {
    id: 'ctd-wealth',
    category: 'Wealth Management',
    color: 'indigo',
    colorBg: 'bg-indigo-50',
    colorBorder: 'border-indigo-100',
    colorText: 'text-indigo-700',
    icon: '📈',
    name: 'Comprehensive Term Life + CI Rider',
    description: 'Financial protection for your family with critical illness coverage up to 300% of sum assured.',
    coverage: 'Up to RM 5,000,000',
    maxEntryAge: '65 years old',
    tenure: 'Up to age 75',
    price: 'From RM 180/month',
    tag: 'Popular',
    features: [
      'Life coverage with CI rider',
      'TPD & death benefit',
      'Level or decreasing coverage',
      'Convertible to whole life',
      'Waiver of premium on CI',
    ],
  },
  {
    id: 'hll-hybrid',
    category: 'Education & Savings',
    color: 'emerald',
    colorBg: 'bg-emerald-50',
    colorBorder: 'border-emerald-100',
    colorText: 'text-emerald-700',
    icon: '🎓',
    name: 'Education Savings Plan',
    description: 'Secure your children\'s education with flexible savings and guaranteed returns.',
    coverage: 'Up to RM 200,000',
    maxEntryAge: '17 years old',
    tenure: '5–20 years',
    price: 'From RM 200/month',
    tag: 'Recommended',
    features: [
      'Guaranteed maturity benefit',
      'Flexible contributiontop-up',
      'Child-specific withdrawal',
      'Parental protection rider',
      'University matching bonus',
    ],
  },
  {
    id: 'inv-pIS',
    category: 'Investment',
    color: 'violet',
    colorBg: 'bg-violet-50',
    colorBorder: 'border-violet-100',
    colorText: 'text-violet-700',
    icon: '💎',
    name: 'Private Investment Solutions (PIS)',
    description: 'Access exclusive investment opportunities in real estate, infrastructure, and alternative assets.',
    coverage: 'Min. investment RM 10,000',
    maxEntryAge: 'N/A',
    tenure: '3–7 years lock-in',
    price: 'Min. RM 10,000',
    tag: 'Exclusive',
    features: [
      'Private equity exposure',
      'Real estate funds',
      'Infrastructure bonds',
      'Diversified alternative assets',
      'Quarterly reporting',
    ],
  },
];

export default function ProductsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore investment and insurance products tailored for Malaysian families
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className={`rounded-xl border ${p.colorBorder} ${p.colorBg} p-6 flex flex-col hover:shadow-md transition cursor-pointer ${selected === p.id ? 'ring-2 ring-offset-2 ring-' + p.color + '-400' : ''}`}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${p.colorBg} border ${p.colorBorder} flex items-center justify-center text-2xl`}>
                {p.icon}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.colorText} ${p.colorBg} border ${p.colorBorder}`}>
                {p.tag}
              </span>
            </div>

            <div className={`text-xs font-semibold uppercase tracking-wide ${p.colorText} mb-1`}>
              {p.category}
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">{p.name}</h3>
            <p className="text-sm text-gray-600 mb-4 flex-1">{p.description}</p>

            <div className="space-y-1.5 mb-4">
              {[
                { label: 'Coverage', value: p.coverage },
                { label: 'Entry Age', value: p.maxEntryAge },
                { label: 'Tenure', value: p.tenure },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>

            <div className={`text-sm font-bold ${p.colorText} mb-4`}>{p.price}</div>

            <button
              className={`w-full py-2.5 rounded-lg text-sm font-semibold ${p.colorBg} border ${p.colorBorder} ${p.colorText} hover:${p.colorBg} transition`}
              onClick={(e) => { e.stopPropagation(); }}
            >
              Enquire Now
            </button>

            {selected === p.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Key Features:</p>
                <ul className="space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className={p.colorText}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-100 rounded-xl p-5">
        <p className="text-sm text-amber-800">
          <strong>Disclaimer:</strong> Products shown are for informational purposes only and do not constitute financial advice.
          Please consult a licensed CFP advisor to assess your specific needs before making any financial decisions.
          Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  );
}
