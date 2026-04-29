'use client';

import { useState, useEffect } from 'react';
import productsData from '@/data/products (full).json';

type Product = {
  id: string;
  category: string;
  'Product Name': string;
  Provider?: string;
  'Coverage Term'?: string;
  'Coverage Term / Max Age'?: string;
  'Min. Premium'?: string;
  'Min. Annual Premium'?: string;
  'Min. SA'?: string;
  'Min / Max Sum Assured'?: string;
  'Key Features'?: string;
  'Min Entry Age'?: string;
  'Max Entry Age'?: string;
  'Entry Age'?: string;
  [key: string]: unknown;
};

const CATEGORY_LABELS: Record<string, string> = {
  life: 'Life Insurance',
  critical_illness: 'Critical Illness',
  medical: 'Medical/Health Insurance',
  savings_endowment_retirement: 'Savings & Endowment',
  others: 'Others',
};

const CATEGORY_COLORS: Record<string, { color: string; colorBg: string; colorBorder: string; colorText: string }> = {
  life: { color: 'indigo', colorBg: 'bg-indigo-50', colorBorder: 'border-indigo-100', colorText: 'text-indigo-700' },
  critical_illness: { color: 'rose', colorBg: 'bg-rose-50', colorBorder: 'border-rose-100', colorText: 'text-rose-700' },
  medical: { color: 'emerald', colorBg: 'bg-emerald-50', colorBorder: 'border-emerald-100', colorText: 'text-emerald-700' },
  savings_endowment_retirement: { color: 'amber', colorBg: 'bg-amber-50', colorBorder: 'border-amber-100', colorText: 'text-amber-700' },
  others: { color: 'slate', colorBg: 'bg-slate-50', colorBorder: 'border-slate-100', colorText: 'text-slate-700' },
};

const CATEGORY_ICONS: Record<string, string> = {
  life: '🛡️',
  critical_illness: '🏥',
  medical: '💊',
  savings_endowment_retirement: '🎯',
  others: '📋',
};

export default function ProductsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(productsData.products as Product[]);
  }, []);

  const categories = Object.entries(productsData.meta.by_category as Record<string, number>);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  const getDisplayValue = (product: Product, key: string): string => {
    const value = product[key];
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          Explore insurance products from Malaysian providers • {productsData.meta.total_products} products available
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            activeCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({productsData.meta.total_products})
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
              activeCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{CATEGORY_ICONS[cat] || '📋'}</span>
            <span>{CATEGORY_LABELS[cat] || cat}</span>
            <span className={`text-xs ${activeCategory === cat ? 'text-gray-300' : 'text-gray-400'}`}>({count})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const colors = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.others;
          const isExpanded = selected === product.id;

          return (
            <div
              key={product.id}
              className={`rounded-xl border ${colors.colorBorder} ${colors.colorBg} p-5 flex flex-col hover:shadow-md transition cursor-pointer ${
                isExpanded ? 'ring-2 ring-offset-2 ring-' + colors.color + '-400' : ''
              }`}
              onClick={() => setSelected(isExpanded ? null : product.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${colors.colorBg} border ${colors.colorBorder} flex items-center justify-center text-lg`}>
                  {CATEGORY_ICONS[product.category] || '📋'}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.colorText} ${colors.colorBg} border ${colors.colorBorder}`}>
                  {CATEGORY_LABELS[product.category] || product.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">{product['Product Name']}</h3>
              {product.Provider && (
                <p className="text-xs text-gray-500 mb-3">{product.Provider}</p>
              )}

              <div className="space-y-1.5 mb-3 flex-1">
                {product.category === 'life' && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage Term</span>
                      <span className="font-medium text-gray-700 truncate ml-2">{getDisplayValue(product, 'Coverage Term')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Min. Premium</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Min. Premium')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Min. SA</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Min. SA')}</span>
                    </div>
                  </>
                )}
                {product.category === 'critical_illness' && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage Term</span>
                      <span className="font-medium text-gray-700 truncate ml-2">{getDisplayValue(product, 'Coverage Term / Max Age')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Sum Assured</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Min / Max Sum Assured')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Entry Age</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Entry Age')}</span>
                    </div>
                  </>
                )}
                {product.category === 'medical' && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage Term</span>
                      <span className="font-medium text-gray-700 truncate ml-2">{getDisplayValue(product, 'Coverage Term / Max Age')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Annual Limit</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Annual Limit')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Lifetime Limit</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Lifetime Limit')}</span>
                    </div>
                  </>
                )}
                {product.category === 'savings_endowment_retirement' && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Premium Term</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Premium Term')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage Period</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Coverage Period')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Min. Annual Premium</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Min. Annual Premium')}</span>
                    </div>
                  </>
                )}
                {product.category === 'others' && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Insurance Type</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Insurance Type')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Coverage Period</span>
                      <span className="font-medium text-gray-700">{getDisplayValue(product, 'Coverage Period')}</span>
                    </div>
                  </>
                )}
              </div>

              {product['Key Features'] && (
                <div className={`text-xs ${colors.colorText} font-medium mb-3`}>
                  {product['Key Features'].substring(0, 60)}
                  {product['Key Features'].length > 60 ? '...' : ''}
                </div>
              )}

              <button
                className={`w-full py-2 rounded-lg text-sm font-semibold ${colors.colorBg} border ${colors.colorBorder} ${colors.colorText} hover:${colors.colorBg} transition`}
                onClick={(e) => { e.stopPropagation(); }}
              >
                Enquire Now
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Details:</p>
                  <div className="space-y-1">
                    {Object.entries(product)
                      .filter(([key]) => !['id', 'category', 'Product Name', 'Provider', 'Key Features'].includes(key))
                      .slice(0, 8)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-500">{key}</span>
                          <span className="font-medium text-gray-700 text-right max-w-[60%] truncate">
                            {String(value).substring(0, 30)}
                            {String(value).length > 30 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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