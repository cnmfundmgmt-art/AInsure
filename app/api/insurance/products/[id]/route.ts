/**
 * GET /api/insurance/products/[id]
 * Returns full product details by ID or product code
 */
import { NextRequest, NextResponse } from 'next/server';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@libsql/client');
  return createClient({ url: DATABASE_URL });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const rows = await db.execute({
      sql: 'SELECT * FROM insurance_products WHERE id = ? OR product_code = ? LIMIT 1',
      args: [id, id],
    });

    if (!rows.rows?.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const p = rows.rows[0] as Record<string, unknown>;

    const product = {
      id: p.id as string,
      productCode: p.product_code as string,
      productName: p.product_name as string,
      provider: p.provider as string,
      policyType: p.policy_type as string,
      monthlyPremiumMin: (p.monthly_premium_min as number) || 0,
      annualPremium: (p.annual_premium as number) || 0,
      coverageAmountMax: (p.coverage_amount_max as number) || 0,
      minEntryAge: (p.min_entry_age as number) || 18,
      maxEntryAge: (p.max_entry_age as number) || 65,
      maxCoverageAge: (p.max_coverage_age as number) || 70,
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
      // Fields that may not exist in DB — safe fallbacks
      waitingPeriodCI: (p.waiting_period_ci as number) || 30,
      coinsurancePct: (p.coinsurance_pct as number) || 10,
      deductibleRM: (p.deductible_rm as number) || 3500,
      premiumHolidayAvailable: (p.premium_holiday as number) === 1,
      expatEligible: (p.expat_eligible as number) === 1,
      keyBenefits: p.key_benefits ? JSON.parse(p.key_benefits as string) : [
        'Life protection coverage',
        'Critical illness rider available',
        'Medical/hospitalization rider available',
        'Cash value accumulation',
        'Premium holiday after 2 years',
      ],
      keyExclusions: p.key_exclusions ? JSON.parse(p.key_exclusions as string) : [
        'Pre-existing conditions (declared and accepted may be excluded)',
        'Self-inflicted injuries within 2 years',
        'War, invasion, act of foreign enemy',
        'Aviation (non-commercial, pilot/aircrew)',
        'Professional sports and dangerous occupations',
        'Drug abuse and alcohol-related claims',
      ],
      claimProcess: (p.claim_process as string) || 'Submit claim form with medical reports and receipts to insurer within 30 days. Processing: 7-14 working days.',
      medicalCheckupRequired: (p.medical_checkup as number) === 1 ? 'Required for coverage above NML' : 'Not required for standard coverage (NML applies)',
      smokerLoading: (p.smoker_loading_pct as number) || 50,
    };

    return NextResponse.json({ product });
  } catch (err) {
    console.error('[product detail error]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
