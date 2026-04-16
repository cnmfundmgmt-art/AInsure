/**
 * Migration: extend insurance_products table + seed products from 5 Malaysian insurers
 * Run: node scripts/migrate-insurance-products.js
 */
const { createClient } = require('@libsql/client');

const client = createClient({ url: 'file:./data/cfp_local.db' });

const migrations = [
  "ALTER TABLE insurance_products ADD COLUMN min_entry_age INTEGER DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN max_entry_age INTEGER DEFAULT 65",
  "ALTER TABLE insurance_products ADD COLUMN coverage_features TEXT",
  "ALTER TABLE insurance_products ADD COLUMN guaranteed_cash_10y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN guaranteed_cash_20y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN guaranteed_cash_30y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN projected_cash_10y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN projected_cash_20y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN projected_cash_30y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN life_cover_10y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN life_cover_20y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN life_cover_30y REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN ci_cover REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN medical_cover REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN annual_premium REAL DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN payment_term_years INTEGER DEFAULT 0",
  "ALTER TABLE insurance_products ADD COLUMN product_summary TEXT",
];

async function migrate() {
  console.log('Running: extend insurance_products table');

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
      console.log('✓ Added:', col);
    } catch (err) {
      if (err.message?.includes('duplicate column name') || err.message?.includes('duplicate column')) {
        const col = sql.match(/ADD COLUMN (\w+)/)?.[1];
        console.log('⚠ Already exists —', col);
      } else {
        console.error('✗ Error:', err.message?.slice(0, 100));
      }
    }
  }

  // Clear existing products
  try {
    await client.execute("DELETE FROM insurance_products");
    console.log('✓ Cleared existing products');
  } catch (err) {
    console.error('✗ Clear error:', err.message?.slice(0, 80));
  }

  // Seed new products
  const products = [
    // ─── AIA Malaysia ───────────────────────────────────────────────────────
    {
      product_code: 'AIA-SIGNATURE-PLUS',
      product_name: 'AIA Signature Plus',
      provider: 'AIA Malaysia',
      policy_type: 'life_health',
      monthly_premium_min: 300,
      coverage_amount_max: 5000000,
      annual_premium: 3600,
      min_entry_age: 15,
      max_entry_age: 60,
      is_takaful: 0,
      ci_cover: 500000,
      medical_cover: 1000000,
      life_cover_10y: 250000, life_cover_20y: 200000, life_cover_30y: 150000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life protection', 'Critical illness 100%', 'Medical card up to RM1M', 'Waiver of premium on disability', 'Annual dividends']),
      product_summary: 'Comprehensive life and health plan with high medical coverage, ideal for breadwinners needing RM1M+ hospital protection.',
    },
    {
      product_code: 'AIA-GROWTH-PLUS',
      product_name: 'AIA Growth Plus',
      provider: 'AIA Malaysia',
      policy_type: 'endowment_investment',
      monthly_premium_min: 200,
      coverage_amount_max: 2000000,
      annual_premium: 2400,
      min_entry_age: 15,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 100000,
      medical_cover: 300000,
      life_cover_10y: 150000, life_cover_20y: 150000, life_cover_30y: 150000,
      guaranteed_cash_10y: 24000, guaranteed_cash_20y: 72000, guaranteed_cash_30y: 132000,
      projected_cash_10y: 30000, projected_cash_20y: 95000, projected_cash_30y: 185000,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover RM150k', 'Critical illness', 'Guaranteed cash value', 'Projected bonuses', 'Flexible premium payment']),
      product_summary: 'Savings-focused endowment with guaranteed cash values — best for clients who want to build savings while staying protected.',
    },
    {
      product_code: 'AIA-CRITICAL-COVER',
      product_name: 'AIA Critical Cover',
      provider: 'AIA Malaysia',
      policy_type: 'critical_illness',
      monthly_premium_min: 150,
      coverage_amount_max: 1000000,
      annual_premium: 1800,
      min_entry_age: 18,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 1000000,
      medical_cover: 0,
      life_cover_10y: 100000, life_cover_20y: 100000, life_cover_30y: 100000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 10,
      coverage_features: JSON.stringify(['37 Critical illness stages covered', 'Lump sum payout on diagnosis', 'Waiver of premium', 'Survivor\'s benefit', 'Optional rider for family']),
      product_summary: 'Pure critical illness plan covering 37 conditions — best for clients who already have basic life cover but need targeted CI protection.',
    },

    // ─── Great Eastern ───────────────────────────────────────────────────────
    {
      product_code: 'GRE-ESSENTIAL-PLUS',
      product_name: 'Great Essential Plus',
      provider: 'Great Eastern',
      policy_type: 'life_health',
      monthly_premium_min: 250,
      coverage_amount_max: 3000000,
      annual_premium: 3000,
      min_entry_age: 16,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 300000,
      medical_cover: 1000000,
      life_cover_10y: 200000, life_cover_20y: 180000, life_cover_30y: 150000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover up to RM3M', 'CI 37 conditions', 'Medical card RM1M', 'Parent\'sCI rider', 'Dividend participation']),
      product_summary: 'Well-rounded life & health plan with Great Eastern\'s strong medical network — popular with Malaysian families for comprehensive protection.',
    },
    {
      product_code: 'GRE-ENDOWMENT-GOLD',
      product_name: 'Great Endowment Gold',
      provider: 'Great Eastern',
      policy_type: 'endowment_investment',
      monthly_premium_min: 200,
      coverage_amount_max: 1500000,
      annual_premium: 2400,
      min_entry_age: 15,
      max_entry_age: 50,
      is_takaful: 0,
      ci_cover: 75000,
      medical_cover: 200000,
      life_cover_10y: 120000, life_cover_20y: 120000, life_cover_30y: 120000,
      guaranteed_cash_10y: 28000, guaranteed_cash_20y: 78000, guaranteed_cash_30y: 145000,
      projected_cash_10y: 35000, projected_cash_20y: 100000, projected_cash_30y: 195000,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Guaranteed cash back', 'Life cover RM120k', 'CI rider', 'Education benefit for children', 'Maturity bonus']),
      product_summary: 'Education-focused endowment with guaranteed maturity benefits — best for parents planning for children\'s university costs in 10-15 years.',
    },
    {
      product_code: 'GRE-SHIELD-SELECT',
      product_name: 'Great Shield Select',
      provider: 'Great Eastern',
      policy_type: 'medical',
      monthly_premium_min: 180,
      coverage_amount_max: 2000000,
      annual_premium: 2160,
      min_entry_age: 18,
      max_entry_age: 60,
      is_takaful: 0,
      ci_cover: 0,
      medical_cover: 2000000,
      life_cover_10y: 50000, life_cover_20y: 50000, life_cover_30y: 50000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 0,
      coverage_features: JSON.stringify(['RM2M annual limit', 'No cashless hospitalization', 'Room & board up to RM350', 'Surgical benefit', 'Post hospitalization 90 days']),
      product_summary: 'High-coverage medical plan with RM2M annual limit — best for clients who want maximum private hospital protection without a premium medical card.',
    },

    // ─── Prudential ─────────────────────────────────────────────────────────
    {
      product_code: 'PRU-SHIELD-PLUS',
      product_name: 'PRUshield Plus',
      provider: 'Prudential Malaysia',
      policy_type: 'medical',
      monthly_premium_min: 200,
      coverage_amount_max: 2000000,
      annual_premium: 2400,
      min_entry_age: 18,
      max_entry_age: 60,
      is_takaful: 0,
      ci_cover: 0,
      medical_cover: 2000000,
      life_cover_10y: 100000, life_cover_20y: 100000, life_cover_30y: 100000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 0,
      coverage_features: JSON.stringify(['RM2M lifetime limit', 'Cashless hospitalization', 'International second opinion', 'Mental health coverage', 'Pregnancy complications']),
      product_summary: 'Premium medical card with cashless access to 90+ hospitals — best for clients who travel frequently and want seamless private hospital access.',
    },
    {
      product_code: 'PRU-CRITICAL-47',
      product_name: 'PRU Critical Coverage 47',
      provider: 'Prudential Malaysia',
      policy_type: 'critical_illness',
      monthly_premium_min: 120,
      coverage_amount_max: 800000,
      annual_premium: 1440,
      min_entry_age: 18,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 800000,
      medical_cover: 0,
      life_cover_10y: 80000, life_cover_20y: 80000, life_cover_30y: 80000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 10,
      coverage_features: JSON.stringify(['47 CI conditions', 'Early to advanced stage CI', 'Lump sum RM800k', 'CI rebate on survival', 'Joint life option']),
      product_summary: 'Broadest CI coverage in market with 47 conditions across all stages — best for clients wanting the most comprehensive critical illness protection available.',
    },
    {
      product_code: 'PRU-ASM-ENDOWMENT',
      product_name: 'PRU asm Save & Protect',
      provider: 'Prudential Malaysia',
      policy_type: 'endowment_investment',
      monthly_premium_min: 180,
      coverage_amount_max: 1000000,
      annual_premium: 2160,
      min_entry_age: 15,
      max_entry_age: 52,
      is_takaful: 0,
      ci_cover: 50000,
      medical_cover: 100000,
      life_cover_10y: 100000, life_cover_20y: 100000, life_cover_30y: 100000,
      guaranteed_cash_10y: 25000, guaranteed_cash_20y: 72000, guaranteed_cash_30y: 130000,
      projected_cash_10y: 32000, projected_cash_20y: 95000, projected_cash_30y: 178000,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover RM100k', 'Guaranteed cash value', 'CI accelerator rider', 'Premium holidays available', 'Flexible top-up']),
      product_summary: 'Flexible savings endowment with premium holiday option — best for business owners or commission-based earners with irregular income.',
    },

    // ─── Allianz ────────────────────────────────────────────────────────────
    {
      product_code: 'ALLIANZ-LIFE-RIDER',
      product_name: 'Allianz Life Protection',
      provider: 'Allianz Malaysia',
      policy_type: 'life',
      monthly_premium_min: 150,
      coverage_amount_max: 3000000,
      annual_premium: 1800,
      min_entry_age: 18,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 150000,
      medical_cover: 500000,
      life_cover_10y: 300000, life_cover_20y: 250000, life_cover_30y: 200000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover up to RM3M', 'CI partial to full', 'Medical card RM500k', 'Terminal illness benefit', 'Worldwide coverage option']),
      product_summary: 'High life cover at competitive premiums — best for clients aged 35-50 who need maximum protection at the lowest premium.',
    },
    {
      product_code: 'ALLIANZ-MEDICASH',
      product_name: 'Allianz Medicare Plus',
      provider: 'Allianz Malaysia',
      policy_type: 'medical',
      monthly_premium_min: 180,
      coverage_amount_max: 1500000,
      annual_premium: 2160,
      min_entry_age: 18,
      max_entry_age: 60,
      is_takaful: 0,
      ci_cover: 0,
      medical_cover: 1500000,
      life_cover_10y: 50000, life_cover_20y: 50000, life_cover_30y: 50000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 0,
      coverage_features: JSON.stringify(['RM1.5M annual limit', 'Cashless at 80+ panel', 'Crisis recovery benefit', 'Home care treatment', 'Outpatient cancer']),
      product_summary: 'Mid-range medical plan with strong outpatient cancer coverage — best for clients wanting solid RM1M+ coverage at moderate premium.',
    },
    {
      product_code: 'ALLIANZ-ENDOWMENT-PLUS',
      product_name: 'Allianz Endowment Optimiser',
      provider: 'Allianz Malaysia',
      policy_type: 'endowment_investment',
      monthly_premium_min: 250,
      coverage_amount_max: 2000000,
      annual_premium: 3000,
      min_entry_age: 15,
      max_entry_age: 50,
      is_takaful: 0,
      ci_cover: 100000,
      medical_cover: 200000,
      life_cover_10y: 150000, life_cover_20y: 150000, life_cover_30y: 150000,
      guaranteed_cash_10y: 32000, guaranteed_cash_20y: 85000, guaranteed_cash_30y: 155000,
      projected_cash_10y: 40000, projected_cash_20y: 110000, projected_cash_30y: 210000,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover RM150k', 'High guaranteed cash', 'CI rider available', 'Maturity benefit RM155k+', 'Bonus transparency']),
      product_summary: 'Highest guaranteed cash value among conventional endowments — best for risk-averse clients who prioritise guaranteed returns over projected growth.',
    },

    // ─── Zurich Malaysia ─────────────────────────────────────────────────────
    {
      product_code: 'ZURICH-LIFE-ACCELERATOR',
      product_name: 'Zurich Life Accelerator',
      provider: 'Zurich Malaysia',
      policy_type: 'life',
      monthly_premium_min: 200,
      coverage_amount_max: 4000000,
      annual_premium: 2400,
      min_entry_age: 18,
      max_entry_age: 55,
      is_takaful: 0,
      ci_cover: 200000,
      medical_cover: 1000000,
      life_cover_10y: 400000, life_cover_20y: 350000, life_cover_30y: 300000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover up to RM4M', 'CI 42 conditions', 'Medical RM1M', 'Accelerated CI payout', 'Income protector rider']),
      product_summary: 'Highest life cover-to-premium ratio in the market — best for young families with large mortgages needing RM2M+ life cover at entry-level premium.',
    },
    {
      product_code: 'ZURICH-ELITE-MEDICAL',
      product_name: 'Zurich Elite Medical',
      provider: 'Zurich Malaysia',
      policy_type: 'medical',
      monthly_premium_min: 220,
      coverage_amount_max: 2000000,
      annual_premium: 2640,
      min_entry_age: 18,
      max_entry_age: 60,
      is_takaful: 0,
      ci_cover: 0,
      medical_cover: 2000000,
      life_cover_10y: 100000, life_cover_20y: 100000, life_cover_30y: 100000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 0,
      coverage_features: JSON.stringify(['RM2M lifetime limit', 'Cashless at 100+ hospitals', 'Dental & optical rider', 'Wellness benefit', 'International coverage add-on']),
      product_summary: 'Premium medical card with wellness benefits and international option — best for affluent clients or expats who want comprehensive private healthcare.',
    },
    {
      product_code: 'ZURICH-ENDOWMENT-PLUS',
      product_name: 'Zurich Endowment Plus',
      provider: 'Zurich Malaysia',
      policy_type: 'endowment_investment',
      monthly_premium_min: 200,
      coverage_amount_max: 1500000,
      annual_premium: 2400,
      min_entry_age: 15,
      max_entry_age: 52,
      is_takaful: 0,
      ci_cover: 75000,
      medical_cover: 150000,
      life_cover_10y: 120000, life_cover_20y: 120000, life_cover_30y: 120000,
      guaranteed_cash_10y: 27000, guaranteed_cash_20y: 75000, guaranteed_cash_30y: 140000,
      projected_cash_10y: 34000, projected_cash_20y: 98000, projected_cash_30y: 188000,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Life cover RM120k', 'CI and medical riders', 'Guaranteed maturity benefit', 'Premium loyalty bonus', 'Top-up investment option']),
      product_summary: 'Well-rounded endowment with loyalty bonus after year 10 — best for clients who plan to hold long-term and want increasing benefits over time.',
    },

    // ─── Takaful (Shariah-compliant) ─────────────────────────────────────────
    {
      product_code: 'TAKAFUL-LIFE-PLUS',
      product_name: 'Takaful Life Plus',
      provider: 'Etiqa Family Takaful',
      policy_type: 'family_takaful',
      monthly_premium_min: 150,
      coverage_amount_max: 2000000,
      annual_premium: 1800,
      min_entry_age: 18,
      max_entry_age: 55,
      is_takaful: 1,
      ci_cover: 200000,
      medical_cover: 500000,
      life_cover_10y: 200000, life_cover_20y: 180000, life_cover_30y: 150000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 20,
      coverage_features: JSON.stringify(['Shariah-compliant', 'Life cover up to RM2M', 'CI 37 conditions', 'Medical card RM500k', 'Tabarru\' fund participation']),
      product_summary: 'Shariah-compliant family takaful — best for Muslim clients who prefer Islamic insurance with similar coverage to conventional life plans.',
    },
    {
      product_code: 'TAKAFUL-MEDICAL-PLUS',
      product_name: 'Takaful Medical Plus',
      provider: 'Etiqa Family Takaful',
      policy_type: 'medical_takaful',
      monthly_premium_min: 130,
      coverage_amount_max: 1000000,
      annual_premium: 1560,
      min_entry_age: 18,
      max_entry_age: 60,
      is_takaful: 1,
      ci_cover: 0,
      medical_cover: 1000000,
      life_cover_10y: 50000, life_cover_20y: 50000, life_cover_30y: 50000,
      guaranteed_cash_10y: 0, guaranteed_cash_20y: 0, guaranteed_cash_30y: 0,
      projected_cash_10y: 0, projected_cash_20y: 0, projected_cash_30y: 0,
      payment_term_years: 0,
      coverage_features: JSON.stringify(['Shariah-compliant', 'RM1M annual limit', 'Cashless at panel hospitals', 'Outpatient benefit', 'Maternity benefit']),
      product_summary: 'Islamic medical takaful with maternity benefits — best for young Muslim families planning children who want Shariah-compliant hospital coverage.',
    },
  ];

  const now = Math.floor(Date.now() / 1000);
  let count = 0;
  for (const p of products) {
    try {
      await client.execute({
        sql: `INSERT INTO insurance_products (
          id, product_code, product_name, provider, policy_type,
          monthly_premium_min, coverage_amount_max, annual_premium,
          min_entry_age, max_entry_age, is_takaful,
          ci_cover, medical_cover,
          life_cover_10y, life_cover_20y, life_cover_30y,
          guaranteed_cash_10y, guaranteed_cash_20y, guaranteed_cash_30y,
          projected_cash_10y, projected_cash_20y, projected_cash_30y,
          payment_term_years, coverage_features, product_summary, last_updated
        ) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.product_code, p.product_name, p.provider, p.policy_type,
          p.monthly_premium_min, p.coverage_amount_max, p.annual_premium,
          p.min_entry_age, p.max_entry_age, p.is_takaful,
          p.ci_cover, p.medical_cover,
          p.life_cover_10y, p.life_cover_20y, p.life_cover_30y,
          p.guaranteed_cash_10y, p.guaranteed_cash_20y, p.guaranteed_cash_30y,
          p.projected_cash_10y, p.projected_cash_20y, p.projected_cash_30y,
          p.payment_term_years, p.coverage_features, p.product_summary, now,
        ],
      });
      count++;
    } catch (err) {
      console.error('✗ Insert error:', err.message?.slice(0, 80), p.product_code);
    }
  }

  console.log(`\n✅ Done — inserted ${count}/${products.length} products`);
  client.close();
}

migrate().catch(console.error);
