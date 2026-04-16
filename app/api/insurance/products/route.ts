/**
 * GET /api/insurance/products
 * Query params: type, maxBudget, minAge, maxAge, sort
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { insuranceProducts } from '@/lib/db/schema';
import { asc, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get('type');
  const maxBudget = parseFloat(searchParams.get('maxBudget') || '0') || 0;
  const minAge = parseInt(searchParams.get('minAge') || '0') || 0;
  const maxAge = parseInt(searchParams.get('maxAge') || '65') || 65;
  const sort = searchParams.get('sort') || 'premium_asc';
  const limit = parseInt(searchParams.get('limit') || '50') || 50;
  const provider = searchParams.get('provider');

  let where = sql`1=1`;
  if (type) where = sql`${insuranceProducts.policyType} = ${type}`;
  if (maxBudget > 0) where = sql`${where} AND ${insuranceProducts.monthlyPremiumMin} <= ${maxBudget}`;
  if (minAge > 0) where = sql`${where} AND ${insuranceProducts.maxEntryAge} >= ${minAge}`;
  if (maxAge < 65) where = sql`${where} AND ${insuranceProducts.minEntryAge} <= ${maxAge}`;
  if (provider) where = sql`${where} AND ${insuranceProducts.provider} = ${provider}`;

  let orderBy;
  switch (sort) {
    case 'premium_desc': orderBy = desc(insuranceProducts.monthlyPremiumMin); break;
    case 'coverage_desc': orderBy = desc(insuranceProducts.coverageAmountMax); break;
    default: orderBy = asc(insuranceProducts.monthlyPremiumMin);
  }

  const rows = await db
    .select()
    .from(insuranceProducts)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .all();

  const products = rows.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    productCode: p.product_code as string,
    productName: p.product_name as string,
    provider: p.provider as string,
    policyType: p.policy_type as string,
    monthlyPremiumMin: (p.monthly_premium_min as number) || 0,
    coverageAmountMax: (p.coverage_amount_max as number) || 0,
    annualPremium: (p.annual_premium as number) || 0,
    minEntryAge: (p.min_entry_age as number) || 0,
    maxEntryAge: (p.max_entry_age as number) || 65,
    isTakaful: (p.is_takaful as number) === 1,
    ciCover: (p.ci_cover as number) || 0,
    medicalCover: (p.medical_cover as number) || 0,
    lifeCover10y: (p.life_cover_10y as number) || 0,
    lifeCover20y: (p.life_cover_20y as number) || 0,
    lifeCover30y: (p.life_cover_30y as number) || 0,
    guaranteedCash10y: (p.guaranteed_cash_10y as number) || 0,
    guaranteedCash20y: (p.guaranteed_cash_20y as number) || 0,
    guaranteedCash30y: (p.guaranteed_cash_30y as number) || 0,
    projectedCash10y: (p.projected_cash_10y as number) || 0,
    projectedCash20y: (p.projected_cash_20y as number) || 0,
    projectedCash30y: (p.projected_cash_30y as number) || 0,
    paymentTermYears: (p.payment_term_years as number) || 0,
    coverageFeatures: p.coverage_features ? JSON.parse(p.coverage_features as string) : [],
    productSummary: (p.product_summary as string) || '',
  }));

  return NextResponse.json({ products, total: products.length });
}
