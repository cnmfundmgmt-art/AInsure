/**
 * POST /api/insurance/chat
 * Query-classifier + handlers for the AI Insurance chatbot
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

function getDb() {
  return createClient({ url: DATABASE_URL });
}

function p(row: Record<string, unknown>, key: string, fallback = 0) {
  const v = row[key];
  if (v === null || v === undefined) return fallback;
  return typeof v === 'number' ? v : fallback;
}

type Prod = {
  id: string; productCode: string; productName: string; provider: string; policyType: string;
  monthlyPremium: number; annualPremium: number; coverageAmountMax: number;
  minEntryAge: number; maxEntryAge: number; isTakaful: boolean;
  ciCover: number; medicalCover: number; lifeCover10y: number; lifeCover20y: number; lifeCover30y: number;
  guaranteedCash10y: number; guaranteedCash20y: number; guaranteedCash30y: number;
  projectedCash10y: number; projectedCash20y: number; projectedCash30y: number;
  paymentTermYears: number; coverageFeatures: string[]; productSummary: string;
};

function parseProducts(rows: Record<string, unknown>[]): Prod[] {
  return rows.map((row) => ({
    id: row.id as string,
    productCode: row.product_code as string,
    productName: row.product_name as string,
    provider: row.provider as string,
    policyType: row.policy_type as string,
    monthlyPremium: p(row, 'monthly_premium_min'),
    annualPremium: p(row, 'annual_premium'),
    coverageAmountMax: p(row, 'coverage_amount_max'),
    minEntryAge: p(row, 'min_entry_age', 0),
    maxEntryAge: p(row, 'max_entry_age', 65),
    isTakaful: p(row, 'is_takaful') === 1,
    ciCover: p(row, 'ci_cover'),
    medicalCover: p(row, 'medical_cover'),
    lifeCover10y: p(row, 'life_cover_10y'),
    lifeCover20y: p(row, 'life_cover_20y'),
    lifeCover30y: p(row, 'life_cover_30y'),
    guaranteedCash10y: p(row, 'guaranteed_cash_10y'),
    guaranteedCash20y: p(row, 'guaranteed_cash_20y'),
    guaranteedCash30y: p(row, 'guaranteed_cash_30y'),
    projectedCash10y: p(row, 'projected_cash_10y'),
    projectedCash20y: p(row, 'projected_cash_20y'),
    projectedCash30y: p(row, 'projected_cash_30y'),
    paymentTermYears: p(row, 'payment_term_years'),
    coverageFeatures: row.coverage_features ? JSON.parse(row.coverage_features as string) : [],
    productSummary: (row.product_summary as string) || '',
  }));
}

function fmt(n: number) {
  return 'RM' + n.toLocaleString('en-MY', { maximumFractionDigits: 0 });
}

type SessionData = {
  data: Record<string, unknown>;
  clientName: string;
  annualIncome: number;
  monthlyBudget: number;
};

async function loadSession(db: ReturnType<typeof getDb>, sessionId?: string): Promise<SessionData | null> {
  if (!sessionId) return null;
  const rows = await db.execute({
    sql: 'SELECT analysis_data, client_name, annual_income, monthly_budget FROM insurance_analysis_sessions WHERE id = ?',
    args: [sessionId],
  });
  if (!rows.rows?.length) return null;
  try {
    const row = rows.rows[0] as Record<string, unknown>;
    return {
      data: JSON.parse(row.analysis_data as string) as Record<string, unknown>,
      clientName: row.client_name as string,
      annualIncome: row.annual_income as number,
      monthlyBudget: row.monthly_budget as number,
    };
  } catch {
    return null;
  }
}

function classify(q: string) {
  // guaranteed vs projected must come before compare (to avoid "X vs Y" matching)
  if (/guaranteed.*projected|guaranteed vs|vs.*guaranteed|non-guaranteed|bonus|annual dividend|vesting|reversionary bonus/.test(q)) return 'guaranteed_vs_projected';
  if (/compare\s/.test(q) || /vs\.?/.test(q) || /versus/.test(q)) return 'compare';
  if (/pitch script|sales script|generate script|how to present|what to say/.test(q)) return 'pitch_script';
  if (/surrender value|cash out|cancel policy|get money back|lapse value/.test(q)) return 'surrender_value';
  if (/qualify|medical check|health condition|blood pressure|diabetes|pre-existing|underwriting|eligibility|smoker/.test(q)) return 'underwriting';
  if (/stop paying|lapse|reinstatement|what happens if.*stop|cancel.*policy|terminate|give up/.test(q)) return 'lapse_reinstatement';
  if (/gap analysis|shortfall|current vs required|how much (coverage|protection|insurance)/.test(q)) return 'gap_analysis';
  if (/illustration|cash value.*projection|projected return|investment return|yield|performance/.test(q)) return 'illustration';
  if (/waiting period|waiting time|how long to claim|claim waiting|ci waiting/.test(q)) return 'waiting_period';
  if (/cover dengue|covered illness|dengue fever|cancer|heart attack|stroke|what illnesses|claimable disease/.test(q)) return 'covered_illness';
  if (/premium holiday|skip payment|pause premium|payment holiday|stop paying premium/.test(q)) return 'premium_holiday';
  if (/breakeven|break even|when do i get my money back|zero sum/.test(q)) return 'breakeven';
  if (/expat|foreigner|non-malaysian|overseas|international|mm2h|epass/.test(q)) return 'expat_eligibility';
  if (/coverage age|until what age|how long coverage|coverage last|expiry|maturity|policy term.*expire/.test(q)) return 'coverage_age';
  if (/pain point|emotional|fear|concern|worry|why buy|what keeps them/.test(q)) return 'pain_points';
  if (/objection|budget objection|too expensive|spouse objection|no time|already have|think about it|call back|not interested|competitor/.test(q)) return 'objection_handlers';
  if (/co-insurance|coinsurance|deductible|co-payment|out of pocket/.test(q)) return 'coinsurance';
  if (/show details|more info|tell me more|full details|product detail/.test(q)) return 'product_detail';
  if (/budget|rm\s?\d+|increase|decrease|reduce|fit.*budget|within.*budget|under.*budget|raise.*budget/.test(q)) return 'budget';
  return 'general';
}

const KNOWN_PROVIDERS = ['aia', 'great eastern', 'prudential', 'allianz', 'zurich', 'etiqa', 'takaful', 'manulife'];

function extractProviders(q: string): string[] {
  const found: string[] = [];
  for (const prov of KNOWN_PROVIDERS) {
    if (q.includes(prov)) found.push(prov.charAt(0).toUpperCase() + prov.slice(1));
  }
  return found;
}

function buildCompareTable(products: Prod[]) {
  const headers = ['Feature', ...products.map((p) => `${p.provider} ${p.productName}`)];
  const rows = [
    ['Provider', ...products.map((p) => p.provider)],
    ['Product Type', ...products.map((p) => p.policyType)],
    ['Monthly Premium', ...products.map((p) => fmt(p.monthlyPremium))],
    ['Annual Premium', ...products.map((p) => fmt(p.annualPremium))],
    ['Life Cover (10yr)', ...products.map((p) => fmt(p.lifeCover10y))],
    ['Life Cover (20yr)', ...products.map((p) => fmt(p.lifeCover20y))],
    ['CI Cover', ...products.map((p) => fmt(p.ciCover))],
    ['Medical Cover', ...products.map((p) => fmt(p.medicalCover))],
    ['Guaranteed Cash Y10', ...products.map((p) => fmt(p.guaranteedCash10y))],
    ['Guaranteed Cash Y20', ...products.map((p) => fmt(p.guaranteedCash20y))],
    ['Projected Cash Y10', ...products.map((p) => fmt(p.projectedCash10y))],
    ['Projected Cash Y20', ...products.map((p) => fmt(p.projectedCash20y))],
    ['Takaful', ...products.map((p) => (p.isTakaful ? 'Yes' : 'No'))],
    ['Payment Term', ...products.map((p) => `${p.paymentTermYears} yrs`)],
  ];
  return { headers, rows };
}

// ─── Handlers ──────────────────────────────────────────────────────────────────

async function handleCompare(db: ReturnType<typeof getDb>, q: string) {
  const providers = extractProviders(q);
  let products: Prod[] = [];

  if (providers.length >= 2) {
    const like1 = `%${providers[0]}%`;
    const like2 = `%${providers[1]}%`;
    const rows = await db.execute({
      sql: `SELECT * FROM insurance_products WHERE provider LIKE ? OR provider LIKE ? ORDER BY monthly_premium_min ASC`,
      args: [like1, like2],
    });
    products = parseProducts(rows.rows || []);
    return {
      type: 'comparison' as const,
      providers: products,
      table: buildCompareTable(products),
    };
  }

  // No specific providers — show top 2 cheapest
  const rows = await db.execute({ sql: 'SELECT * FROM insurance_products ORDER BY monthly_premium_min ASC LIMIT 2', args: [] });
  products = parseProducts(rows.rows || []);
  return {
    type: 'comparison' as const,
    providers: products,
    table: buildCompareTable(products),
    message: `No specific providers mentioned — showing top 2 most affordable plans for comparison:`,
  };
}

async function handleBudget(db: ReturnType<typeof getDb>, q: string, session: SessionData | null) {
  const sessionData = session?.data;
  const client = (sessionData?.clientData as Record<string, unknown>) || {};
  const income = (client.income as number) || 0;
  const age = (client.age as number) || 40;
  const existingBudget = (client.monthlyBudget as number) || Math.max((income / 12) * 0.2, 300);

  const budgetMatch = q.match(/rm?\s?(\d+)/i);
  let effectiveBudget = existingBudget;

  if (/increase|add|raise|up/.test(q)) {
    const inc = budgetMatch ? parseInt(budgetMatch[1]) : 200;
    effectiveBudget = existingBudget + inc;
  } else if (/decrease|reduce|lower|drop/.test(q)) {
    effectiveBudget = budgetMatch ? parseInt(budgetMatch[1]) : 300;
  } else if (/fit|under|within/.test(q)) {
    effectiveBudget = budgetMatch ? parseInt(budgetMatch[1]) : 300;
  } else if (budgetMatch) {
    effectiveBudget = parseInt(budgetMatch[1]);
  }

  const rows = await db.execute({ sql: 'SELECT * FROM insurance_products', args: [] });
  const all = parseProducts(rows.rows || []);

  const eligible = all
    .filter((pr) => pr.monthlyPremium <= effectiveBudget * 1.2 && age >= pr.minEntryAge && age <= pr.maxEntryAge)
    .sort((a, b) => a.monthlyPremium - b.monthlyPremium)
    .slice(0, 5);

  const lifeMultiplier = age > 55 ? 5 : 8;
  const gap = {
    life: { required: income * lifeMultiplier, existing: 0, gap: income * lifeMultiplier },
    ci: { required: Math.max(income * 3, 150000), existing: 0, gap: Math.max(income * 3, 150000) },
    medical: { required: 1000000, existing: 0, gap: 1000000 },
  };

  const msg = eligible.length > 0
    ? `Found ${eligible.length} plan${eligible.length > 1 ? 's' : ''} within ${fmt(effectiveBudget)}/month for age ${age}. Top matches:`
    : `No plans fit within ${fmt(effectiveBudget)}/month for age ${age}. Lowest starts at ${all.length ? fmt(all[0].monthlyPremium) : 'N/A'}.`;

  return {
    type: 'budget' as const,
    message: msg,
    budgetUsed: effectiveBudget,
    originalBudget: existingBudget,
    products: eligible.map((pr, i) => ({
      rank: i + 1,
      product: pr,
      advisorNote: i === 0 ? `#1 Best Match — ${pr.productSummary || 'Recommended'}` : `Alternative — ${pr.productName}`,
    })),
    newGap: gap,
  };
}

function handlePitchScript(session: SessionData | null) {
  const sessionData = session?.data;
  const client = (sessionData?.clientData as Record<string, unknown>) || {};
  const name = (client.name as string) || 'your client';
  const income = (client.income as number) || 0;
  const age = (client.age as number) || 40;
  const monthlyBudget = (client.monthlyBudget as number) || Math.max((income / 12) * 0.2, 300);
  const gap = (sessionData?.gapAnalysis as Record<string, { gap: number }>) || { life: { gap: income * 8 }, ci: { gap: Math.max(income * 3, 150000) }, medical: { gap: 1000000 } };

  const script = `## The Hook

"${name}, I want to share something I found after reviewing ${name.split(' ')[0]}'s financial situation.

If something happened to you tomorrow — critical illness, disability, or worse — would your family be financially protected? Most people discover they have a **gap of ${fmt((gap.life?.gap || 0) + (gap.ci?.gap || 0))}** that their current coverage doesn't address.

---

## The Pivot

Based on ${name.split(' ')[0]}'s income of ${fmt(income)}/year, age ${age}, and budget of ${fmt(monthlyBudget)}/month, here are the **top protection gaps**:

| Protection | Required | Gap |
|---|---|---|
| Life | ${fmt(income * (age > 55 ? 5 : 8))} | ${fmt(gap.life?.gap || 0)} |
| Critical Illness | ${fmt(Math.max(income * 3, 150000))} | ${fmt(gap.ci?.gap || 0)} |
| Medical | ${fmt(1000000)} | ${fmt(gap.medical?.gap || 0)} |

The good news: We can close this for just **${fmt(monthlyBudget)}/month** — less than ${fmt(income / 12 / 4)} a week.

---

## Key Benefits

- Payment term up to ${Math.min(65 - age, 30)} years — pay for a set period, covered for life
- Critical Illness coverage — pays on diagnosis
- Premium holiday available — after 2 years, you can pause payments
- Guaranteed cash value — builds over time
- Takaful option available

---

## Objection: "Too expensive"

"${name.split(' ')[0]}, I understand. The average Malaysian family spends more on lifestyle in a month than this costs. For just **${fmt(monthlyBudget)}/month**, you're securing **${fmt((gap.life?.gap || 0) + (gap.ci?.gap || 0))}** in protection. What's protecting your family's future worth?"

---

## The Close

"Based on everything we've discussed, I recommend coverage of **${fmt(monthlyBudget)}/month** addressing your three biggest gaps. Shall we proceed with the illustration?"`;

  return { type: 'pitch_script' as const, script };
}

function getSessionProducts(session: SessionData | null): Prod | null {
  if (!session) return null;
  const sessionData = session.data;
  const prods = sessionData?.recommendedProducts as Array<{ product: Prod }> | undefined;
  return prods?.[0]?.product || null;
}

function handleSurrenderValue(session: SessionData | null) {
  const product = getSessionProducts(session);
  if (!product) {
    return { type: 'surrender_value' as const, product: null, schedule: [], message: 'No product in session. Run an analysis first.' };
  }

  const annual = product.annualPremium;
  const g10 = product.guaranteedCash10y;
  const g20 = product.guaranteedCash20y;
  const g30 = product.guaranteedCash30y;
  const p10 = product.projectedCash10y;
  const p20 = product.projectedCash20y;
  const p30 = product.projectedCash30y;

  const schedule = [
    { year: 1, cumulative: annual, guaranteed: Math.round(annual * 0.1), projected: Math.round(annual * 0.15) },
    { year: 2, cumulative: annual * 2, guaranteed: Math.round(annual * 0.3), projected: Math.round(annual * 0.4) },
    { year: 3, cumulative: annual * 3, guaranteed: Math.round(annual * 0.5), projected: Math.round(annual * 0.7) },
    { year: 5, cumulative: annual * 5, guaranteed: Math.round(g10), projected: Math.round(p10) },
    { year: 7, cumulative: annual * 7, guaranteed: Math.round(g10 * 1.2), projected: Math.round(p10 * 1.3) },
    { year: 10, cumulative: annual * 10, guaranteed: Math.round(g10), projected: Math.round(p10) },
    { year: 15, cumulative: annual * 15, guaranteed: Math.round(g20 * 0.7), projected: Math.round(p20 * 0.8) },
    { year: 20, cumulative: annual * 20, guaranteed: Math.round(g20), projected: Math.round(p20) },
    { year: 25, cumulative: annual * 25, guaranteed: Math.round(g30 * 0.6), projected: Math.round(p30 * 0.7) },
    { year: 30, cumulative: annual * 30, guaranteed: Math.round(g30), projected: Math.round(p30) },
  ];

  return {
    type: 'surrender_value' as const,
    product: { name: product.productName, provider: product.provider },
    schedule,
    message: `Surrender value for **${product.productName}** (${product.provider}) — annual premium ${fmt(annual)}:`,
  };
}

function handleUnderwriting() {
  return {
    type: 'underwriting' as const,
    guidelines: `Standard Malaysian Life/CI Underwriting:

**Full medical underwriting** required for coverage above RM500,000 or ages 45+.

**Non-Medical Limit (NML):**
- Ages 18-45: up to RM300,000 without medical checkup
- Ages 46-55: up to RM150,000 without medical checkup
- Ages 56+: medical exam required regardless

**Pre-existing conditions:**
- High blood pressure (controlled): Accepted with +25-50% loading
- Diabetes Type 2 (controlled): Accepted with loading or declined (depends on severity)
- High cholesterol: Accepted with +15-25% loading
- Asthma (non-smoker, no hosp. 2yrs): Usually standard
- Cancer history: Usually declined unless 5+ years remission

**Smoker loading:** Typically +50-100% premium

> Disclaimer: Each insurer has own underwriting table. Actual decision depends on full health history.`,
  };
}

function handleLapseReinstatement() {
  return {
    type: 'lapse_reinstatement' as const,
    description: `**What happens if premiums stop being paid:**

**Grace period:** 30 days after premium due date — policy remains in force.

**Policy lapse:** After grace period — coverage ends, no claims.

**Reduced paid-up:** Some policies auto-convert if sufficient cash value has accumulated — reduces sum assured proportionally.

**Reinstatement:** Lapsed policies can be reinstated within 2-5 years by paying overdue premiums + interest + updated health declaration. New medical may be required. Waiting periods restart from Day 1.`,
    key_terms: [
      'Grace period: 30 days — policy in force during this time',
      'Policy lapse: coverage ends after grace period',
      'Reduced paid-up: auto-converts if cash value accumulated (reduces coverage)',
      'Reinstatement: 2-5 years to restore — pay arrears + interest + health update',
      'New waiting periods restart from zero upon reinstatement',
    ],
  };
}

function handleGapAnalysis(session: SessionData | null) {
  const client = (session?.data?.clientData as Record<string, unknown>) || {};
  const income = (client.income as number) || 0;
  const age = (client.age as number) || 40;

  if (!income) {
    return { type: 'gap_analysis' as const, gap: null, income: 0, age, message: 'No client data. Start an analysis first.' };
  }

  const lm = age > 55 ? 5 : 8;
  const gap = {
    life: { required: income * lm, existing: 0, gap: income * lm },
    ci: { required: Math.max(income * 3, 150000), existing: 0, gap: Math.max(income * 3, 150000) },
    medical: { required: 1000000, existing: 0, gap: 1000000 },
  };

  return {
    type: 'gap_analysis' as const,
    gap,
    income,
    age,
    message: `Based on ${fmt(income)}/year income and age ${age}, here is the protection gap:`,
  };
}

function handleIllustration(session: SessionData | null) {
  const product = getSessionProducts(session);
  if (!product) {
    return { type: 'illustration' as const, product: null, chartData: null, message: 'No product in session. Run an analysis first.' };
  }

  const annual = product.annualPremium;
  const g10 = product.guaranteedCash10y;
  const g20 = product.guaranteedCash20y;
  const g30 = product.guaranteedCash30y;
  const p10 = product.projectedCash10y;
  const p20 = product.projectedCash20y;
  const p30 = product.projectedCash30y;

  const labels = ['Year 5', 'Year 10', 'Year 15', 'Year 20', 'Year 25', 'Year 30'];
  const guaranteed = [Math.round(g10), Math.round(g10), Math.round(g20 * 0.7), Math.round(g20), Math.round(g30 * 0.6), Math.round(g30)];
  const projected = [Math.round(p10), Math.round(p10), Math.round(p20 * 0.7), Math.round(p20), Math.round(p30 * 0.6), Math.round(p30)];
  const cumulative = [annual * 5, annual * 10, annual * 15, annual * 20, annual * 25, annual * 30];

  let breakeven: number | null = null;
  for (let i = 0; i < guaranteed.length; i++) {
    if (guaranteed[i] >= cumulative[i]) { breakeven = parseInt(labels[i].replace('Year ', '')); break; }
  }

  return {
    type: 'illustration' as const,
    product: { name: product.productName, provider: product.provider },
    chartData: { labels, guaranteed, projected, cumulative },
    breakeven,
    message: `Cash value illustration for **${product.productName}** (${product.provider}) — annual premium ${fmt(annual)}:`,
  };
}

function handleWaitingPeriod() {
  return {
    type: 'waiting_period' as const,
    ci_waiting_days: 30,
    medical_waiting_days: 30,
    notes: [
      '**CI waiting period:** 30 days (early stage), 90 days (advanced CI), 120 days (specific conditions like cancer).',
      '**Medical/hospitalization:** 30 days for illness. **No waiting for accidents.**',
      '**Maternity:** 120-365 days (varies by insurer).',
      '**Specified illness (diabetes, hypertension):** 90-day waiting.',
      'Waiting periods do NOT apply to accidents — covered from Day 1.',
      'Upon reinstatement after lapse, all waiting periods restart from Day 1.',
    ],
  };
}

function handleCoveredIllness() {
  return {
    type: 'covered_illness' as const,
    common_ci_list: [
      'Dengue Fever — covered under most medical plans (hospitalization benefit)',
      'Cancer — all stages covered under CI riders (early CI optional add-on)',
      'Heart Attack — defined by cardiologist + enzyme markers',
      'Stroke — with neurological deficit lasting 24+ hours',
      'Chronic Lung Disease — end-stage requiring oxygen',
      'Coronary Artery Disease — requiring bypass or angioplasty surgery',
      'Kidney Failure — requiring dialysis',
      'Major Organ Transplant — bone marrow, kidney, liver, heart, lung',
      'Paralysis — complete and irreversible',
      'Major Bone Fractures — via accident benefit',
    ],
    claim_process: `**Claim Process:**

1. Notify insurer within 30 days of diagnosis/hospitalization
2. Get claim form (online or branch)
3. Gather: IC copy, medical report, discharge summary, hospital receipts, diagnostic reports
4. Submit via: online portal (fastest), email, or walk-in
5. Processing: 7-14 working days
6. Payment: bank transfer or credit to hospital (cashless at panel hospitals)

**Dengue:** Hospitalization receipts + discharge summary — usually straightforward.`,
    notes: [
      'Coverage varies by insurer and plan — check the policy schedule.',
      'CI must meet the specific definition in the policy, not just the diagnosis name.',
      'Early-stage CI riders (e.g., AIA Early CI) cover Stage 0-1 cancers at 10-25% of benefit.',
    ],
  };
}

function handlePremiumHoliday() {
  return {
    type: 'premium_holiday' as const,
    available: true,
    conditions: [
      'Available after 2-3 consecutive years of premium payment',
      'Policy must be in force with sufficient cash value',
      'Holiday duration: 3-12 months depending on accumulated cash value',
      'Coverage continues during holiday (same as paid-up status)',
      'Policyholder can resume premiums at any time',
    ],
    max_years: 12,
    notes: [
      'Some plans reduce sum assured proportionally during premium holiday.',
      'Not all policies offer this benefit — endowment/savings plans typically qualify; pure term plans do not.',
    ],
  };
}

function handleBreakeven(session: SessionData | null) {
  const product = getSessionProducts(session);
  if (!product) return { type: 'breakeven' as const, year: null, explanation: 'No product in session. Run an analysis first.', product: null };

  const annual = product.annualPremium;
  const g10 = product.guaranteedCash10y;
  const g20 = product.guaranteedCash20y;
  const g30 = product.guaranteedCash30y;

  let year = 0;
  for (const [g, label] of [[g10, 10], [g20, 20], [g30, 30]] as [number, number][]) {
    if (g >= annual * label) { year = label; break; }
  }

  const explanation = year > 0
    ? `For **${product.productName}**, guaranteed surrender value equals total premiums paid at approximately **Year ${year}**.\n\n- Years 1-${year - 1}: Guaranteed value is LESS than premiums paid — surrendering means a loss.\n- Year ${year}: Breakeven point — you've gotten all your money back in guaranteed value.\n- Year ${year}+: Any surrender value above what you paid is profit.\n\nThe **projected** (non-guaranteed) value typically breaks even 3-5 years earlier due to bonuses/dividends.`
    : `Based on available cash values, **${product.productName}** may not reach guaranteed breakeven within the policy term. Check the policy illustration for projected breakeven.`;

  return { type: 'breakeven' as const, year, explanation, product: { name: product.productName, provider: product.provider } };
}

function handleExpatEligibility() {
  return {
    type: 'expat_eligibility' as const,
    eligible: false,
    conditions: [
      'Most Malaysian plans require Malaysian citizenship or PR.',
      'Non-Malaysians on valid work passes (EP, DP, RP) may be eligible for employer group plans but often excluded from individual plans.',
      'MM2H participants: Some insurers accept MM2H visa holders.',
      'Foreign nationals typically need 6-12 months Malaysian residency before applying for individual plans.',
      'International/overseas treatment coverage usually limited or excluded for non-residents.',
    ],
    max_coverage_age: 65,
    notes: [
      'Expat eligibility rules change frequently — verify with the specific insurer.',
      'Some international insurers (Allianz, Aetna) offer global health plans for expats in Malaysia.',
      'CI plans: Generally NOT available to non-residents in Malaysia.',
    ],
  };
}

function handleCoverageAge(session: SessionData | null) {
  const product = getSessionProducts(session);
  const maxEntryAge = product?.maxEntryAge || 65;
  const paymentYears = product?.paymentTermYears || (maxEntryAge > 55 ? 10 : 30);
  const minEntryAge = product?.minEntryAge || 18;

  return {
    type: 'coverage_age' as const,
    max_age: maxEntryAge + (paymentYears > 0 ? paymentYears : 30),
    policy_term_years: paymentYears,
    entry_age: minEntryAge,
    expiry_age: maxEntryAge,
    notes: [
      `Coverage expires at age ${maxEntryAge} unless a maturity benefit is payable earlier.`,
      `Entry age range: ${minEntryAge} to ${maxEntryAge} years.`,
      paymentYears > 0 ? `Payment term: ${paymentYears} years — after payment ends, coverage continues to expiry.` : 'Coverage continues until expiry age regardless of payment term.',
      'Some whole life plans: pay for 10 years, covered to age 100.',
      'After policy expiry/maturity, no further claims can be made.',
    ],
  };
}

function handlePainPoints(session: SessionData | null) {
  const client = (session?.data?.clientData as Record<string, unknown>) || {};
  const income = (client.income as number) || 0;
  const age = (client.age as number) || 40;
  const gap = (session?.data?.gapAnalysis as Record<string, { gap: number }>) || { life: { gap: income * 8 }, ci: { gap: Math.max(income * 3, 150000) }, medical: { gap: 1000000 } };

  return {
    type: 'pain_points' as const,
    painPoints: [
      {
        id: '1',
        title: `"If I get CI, my family loses their income"`,
        description: `At ${fmt(income)}/year, a CI like cancer or heart attack means 1-3 years of treatment. Bills don't stop. Your family needs ${fmt(gap.ci?.gap || Math.max(income * 3, 150000))} in CI cover.`,
        financialImpact: `CI cover gap: ${fmt(gap.ci?.gap || Math.max(income * 3, 150000))}`,
        urgency: 'high' as const,
      },
      {
        id: '2',
        title: `"If I pass away, who pays the mortgage?"`,
        description: `In Malaysia, most families have home loans and car loans. If the income earner dies, the family still owes. Life insurance ensures ${fmt(gap.life?.gap || income * 8)} clears debts and provides for the family.`,
        financialImpact: `Life cover gap: ${fmt(gap.life?.gap || income * 8)}`,
        urgency: 'high' as const,
      },
      {
        id: '3',
        title: `"One hospital stay could wipe out our savings"`,
        description: `A 10-day ICU stay in a private hospital costs RM30,000-RM100,000+. Medical insurance covers this so your savings aren't wiped out.`,
        financialImpact: `Medical cover gap: ${fmt(gap.medical?.gap || 1000000)}`,
        urgency: 'medium' as const,
      },
      {
        id: '4',
        title: `"I'm already paying for insurance — is it enough?"`,
        description: `Most people don't know their actual gap. A proper analysis often reveals 60-80% underinsurance. The cost to fix it is usually less than a smartphone.`,
        financialImpact: 'Coverage review recommended',
        urgency: 'medium' as const,
      },
    ],
    sessionBased: !!session,
  };
}

function handleObjectionHandlers() {
  return {
    type: 'objection_handlers' as const,
    handlers: [
      {
        objection: '"This is too expensive"',
        response: '"I understand. What if I showed you that the average Malaysian family spends more on dining out in a year than this coverage costs? At just X/month, this is less than your weekly grocery bill — but it protects everything you\'ve built."',
        urgency: 'high',
      },
      {
        objection: '"My spouse will say no"',
        response: '"That\'s a great sign — you\'re both thinking about the family. Let me show you both the numbers. When you see the gap, I think you\'ll be aligned."',
        urgency: 'high',
      },
      {
        objection: '"I have insurance from work"',
        response: '"Great! Most corporate plans provide RM50,000-RM200,000 — but if you change jobs, that coverage stops. Individual insurance stays with you for life. Let\'s check your gap."',
        urgency: 'medium',
      },
      {
        objection: '"I\'m young and healthy — I\'ll get it later"',
        response: '"That\'s exactly when it\'s cheapest! At your age, the same coverage costs 40-60% less than at 45. And most CI cases we see are in people aged 35-55 who were healthy before diagnosis."',
        urgency: 'medium',
      },
      {
        objection: '"I need to think about it / call back"',
        response: '"Absolutely — this is a big decision. Can I ask what specifically you need to think through? Is it the cost, coverage, or something else? I\'d rather address that now so you can make an informed choice."',
        urgency: 'low',
      },
      {
        objection: '"Competitor offered something cheaper"',
        response: '"I\'m glad they\'re providing options! Can you share what they quoted? I can compare the coverage side-by-side. Often the cheapest option has gaps that aren\'t obvious until a claim is made."',
        urgency: 'medium',
      },
    ],
  };
}

function handleCoinsurance() {
  return {
    type: 'coinsurance' as const,
    coinsurance_pct: 10,
    deductible_rm: 3500,
    explanation: `**How co-insurance works in Malaysian medical insurance:**

**Deductible:** Amount YOU pay first before insurance kicks in. Typical: RM350-RM3,500 per admission (varies by room type).

**Co-insurance:** After deductible, you pay a percentage of the remaining bill. Typical: **10%**.

**Example (RM20,000 hospital bill):**
| Item | Amount |
|---|---|
| Total bill | RM20,000 |
| Less: Deductible | -RM3,500 |
| Amount above deductible | RM16,500 |
| Co-insurance (10%) | -RM1,650 |
| **Insurer pays** | **RM14,850** |
| **You pay** | **RM5,150** |

**Typical deductible by room:**
- Ward/Class 2-3: RM350-RM1,000
- Class 1: RM2,000-RM3,500
- Private/Suite: RM3,500-RM10,000`,
    notes: [
      'NCD (No-Claim Bonus) reduces deductible over time with most insurers.',
      'Co-insurance usually does NOT apply to life/CI claims — only medical/hospital.',
      'Non-panel hospitals may have higher co-insurance.',
    ],
  };
}

function handleGuaranteedVsProjected() {
  return {
    type: 'guaranteed_vs_projected' as const,
    explanation: 'Understanding this difference is essential for choosing the right plan.',
    guaranteed_meaning: `**Guaranteed Cash Value** is the minimum contractual value the insurer MUST pay on surrender. It is:
- Written in the policy contract
- Cannot be reduced by the insurer
- Based on actual premiums paid minus insurer charges
- Typically reaches breakeven around Year 10-20`,
    projected_meaning: `**Projected Cash Value (Non-Guaranteed)** is what the policy MAY be worth based on:
- Annual bonus rates declared by the insurer
- Investment performance of the underlying fund (for ILP policies)
- Historical returns

This is NOT guaranteed and depends on insurer profitability and market conditions.`,
    disclaimer: `Important: The insurer is only obligated to pay the guaranteed cash value. Projected values are NOT guaranteed. Past performance does not guarantee future rates. Always compare products based on guaranteed values first.`,
  };
}

function handleGeneral(rawQuery: string, session: SessionData | null) {
  const q = rawQuery.toLowerCase();
  const name = (session?.data?.clientData as Record<string, unknown>)?.name as string || 'there';
  const income = (session?.data?.clientData as Record<string, unknown>)?.income as number || 0;
  const age = (session?.data?.clientData as Record<string, unknown>)?.age as number || 0;
  const budget = (session?.data?.clientData as Record<string, unknown>)?.monthlyBudget as number || 0;
  const prods = session?.data?.recommendedProducts as Array<{ product: Prod }> | undefined;

  // Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(q.trim())) {
    const loaded = session ? 'your client profile loaded' : 'no client profile yet';
    const ctx = session && income ? '. I can see ' + name + "'s income is " + fmt(income) + '/yr with a budget of ' + fmt(budget) + '/month.' : '.';
    return { type: 'general' as const, response: 'Hi! I am your AI Insurance Strategist' + (name !== 'there' ? ' for ' + name : '') + '. I have ' + loaded + ctx + ' What would you like to know?', suggestions: getDefaultSuggestions() };
  }

  // How much coverage do I need
  if (/how much.*cover|how much.*insurance|i need.*cover|coverage.*need|coverage.*enough/.test(q)) {
    if (income && age) {
      const life = income * (age > 55 ? 5 : 8);
      const ci = Math.max(income * 3, 150000);
      const med = 1000000;
      return { type: 'gap_analysis' as const, gap: { life: { required: life, existing: 0, gap: life }, ci: { required: ci, existing: 0, gap: ci }, medical: { required: med, existing: 0, gap: med } }, income, age, message: (name !== 'there' ? name + ', h' : 'H') + 'ere is a quick coverage needs assessment based on income of ' + fmt(income) + '/year and age ' + age + ':' };
    }
    return { type: 'general' as const, response: 'For Malaysian families, a good starting point is:\n\n* Life cover: 8-10x annual income (or 5x for age 55+)\n* Critical Illness: 3-5x annual income\n* Medical/Hospital: RM1,000,000 minimum\n\nStart an analysis with your client\'s income and age for a personalized gap report!', suggestions: ['Show gap analysis', 'Start Analysis with client data'] };
  }

  // Best plan / which plan
  if (/best plan|which plan|what.*recommend|top.*plan|which.*product|recommended.*product/.test(q)) {
    if (prods?.length) {
      const top = prods[0].product;
      return { type: 'product_detail' as const, message: 'Based on the current analysis' + (name !== 'there' ? ' for ' + name : '') + ', my top recommendation is **' + top.productName + '** (' + top.provider + '):\n\n* ' + fmt(top.monthlyPremium) + '/month\n* Life: ' + fmt(top.lifeCover10y) + ' | CI: ' + fmt(top.ciCover) + ' | Medical: ' + fmt(top.medicalCover) + '\n\nSelect it from the product browser or ask me for a comparison!', products: [{ rank: 1, product: top, advisorNote: 'Top recommendation based on current analysis' }] };
    }
    return { type: 'general' as const, response: 'To get a personalized recommendation, I need to run a full analysis with your client details (income, age, budget). Use the Client Intake form on the left and click Start Analysis!', suggestions: ['Start Analysis with client data', 'Compare Great Eastern vs AIA'] };
  }

  // Cost / expensive
  if (/cost|expensive|cheap|afford|price.*month|monthly.*cost/.test(q)) {
    if (budget) {
      return { type: 'budget' as const, message: (name !== 'there' ? name + "'s " : '') + 'current budget is ' + fmt(budget) + '/month. I can show you plans within this budget - just ask!', budgetUsed: budget, originalBudget: budget, products: [], newGap: null };
    }
    return { type: 'general' as const, response: 'Insurance costs in Malaysia vary widely:\n\n* Term life (RM500k cover): RM30-RM200/month depending on age and health\n* CI rider: RM50-RM200/month\n* Medical plan (RM1M): RM150-RM500/month\n* Investment-linked plan: RM300-RM1,000+/month\n\nMost working adults spend RM300-RM800/month for comprehensive coverage. What is your client\'s budget?', suggestions: ['What if budget is RM300?', 'What if budget is RM500?'] };
  }

  // Difference between types
  if (/difference between|what.*difference|compare.*term.*whole|term.*vs.*whole/.test(q)) {
    return { type: 'general' as const, response: '**Term vs Whole Life vs ILP:**\n\n**Term Insurance** - Cheapest pure protection. Covers for set period (10/20/30 years). No cash value. Best for: temporary needs like mortgage or children\'s education.\n\n**Whole Life** - Covers entire lifetime. Guaranteed cash value. Higher premium. Best for: estate planning, wealth transfer.\n\n**Investment-Linked Plan (ILP)** - Combines protection + investment. Cash value tied to fund performance (non-guaranteed). Flexible premiums. Best for: long-term investors who want growth potential.\n\n**Endowment/Savings** - Traditional savings plan. Guaranteed maturity amount. No investment flexibility. Best for: conservative savers.', suggestions: ['Compare term vs whole life', 'Explain ILP vs endowment'] };
  }

  // How to claim
  if (/how to claim|claim.*process|file.*claim|claim.*step|making.*claim/.test(q)) {
    return { type: 'covered_illness' as const, common_ci_list: ['Submit claim form with IC, medical report, discharge summary and receipts within 30 days'], claim_process: '**Claim Steps:**\n\n1. Notify insurer within 30 days of diagnosis/hospitalization\n2. Get claim form from insurer website or branch\n3. Gather: IC copy, medical report, discharge summary, itemized bills\n4. Submit: online portal (fastest - 7-14 days), email, or walk-in\n5. Payment: bank transfer or credit to hospital (cashless at panel)\n\n**Dengue:** Direct claim - just submit receipts + discharge summary.', notes: ['Keep all receipts and medical reports', 'Check panel hospital list for cashless admission', 'CI claims need confirmed diagnosis meeting policy definition'] };
  }

  // Is client covered for specific condition
  if (/covered for|does.*cover|am i covered|is.*covered|cover.*dengue|cover.*cancer|cover.*heart/.test(q)) {
    return { type: 'covered_illness' as const, message: 'Most Malaysian life/CI plans cover:\n\n* Dengue Fever - hospitalization benefit (medical rider)\n* Cancer - CI rider (all stages; early stage may need optional rider)\n* Heart attack, stroke - standard CI\n* Kidney failure, major organ transplant\n\nKey exclusions: Pre-existing conditions not declared, self-inflicted injuries (2yr), war, dangerous occupations.\n\nWant me to check a specific product?', common_ci_list: ['Dengue Fever (hospitalization benefit)', 'Cancer (CI rider)', 'Heart Attack', 'Stroke', 'Kidney Failure', 'Coronary Artery Disease'], claim_process: 'Submit claim with medical report and receipts. Check policy schedule for exact covered conditions.', notes: ['Coverage varies by insurer and plan type', 'CI must meet specific definition in the policy contract', 'Pre-existing conditions must be declared at underwriting'] };
  }

  // Payment term
  if (/how long.*pay|payment term|pay.*years|limited pay|single premium|annual premium/.test(q)) {
    return { type: 'general' as const, response: '**Payment Terms:**\n\n* Single Premium: Pay once, covered for life (whole life/takaful)\n* Limited Pay: Pay for 5/10/15/20/25 years - covered for longer or life\n* Regular Premium: Pay until age 65 or expiry - lowest premium per unit of coverage\n\nMost Malaysian ILPs and endowments offer Limited Pay 10/15/20 years with coverage to age 65 or 100.\n\nShorter payment term = higher premium but less total paid. Longer term = more affordable monthly but more total cost.', suggestions: ['Compare payment terms', 'Show surrender value'] };
  }

  // Why buy insurance
  if (/why buy|why.*insurance|need.*insurance|should.*buy|important.*insurance/.test(q)) {
    const imp = income ? fmt(income * 8) : 'RM500,000+';
    const ici = income ? fmt(Math.max(income * 3, 150000)) : 'RM150,000+';
    return { type: 'pain_points' as const, painPoints: [
      { id: '1', title: '"If I die, my family loses everything"', description: 'Income stops. Mortgage continues. Children need education. Life insurance replaces years of income so the family maintains lifestyle.', financialImpact: 'Income replacement: ' + imp, urgency: 'high' },
      { id: '2', title: '"One CI diagnosis wipes out savings"', description: 'Cancer, heart attack, stroke - treatment costs RM50,000-RM500,000+. CI cover pays lump sum for treatment and lost income.', financialImpact: 'CI cover gap: ' + ici, urgency: 'high' },
      { id: '3', title: '"Private hospital costs can bankrupt us"', description: 'A 2-week ICU stay in a private hospital: RM20,000-RM100,000+. Medical insurance covers this.', financialImpact: 'Medical gap: RM1,000,000 recommended', urgency: 'high' },
    ], sessionBased: !!session };
  }

  // Takaful question
  if (/takaful|is Islamic|shariah|islamic insurance/.test(q)) {
    return { type: 'general' as const, response: '**Takaful vs Conventional Insurance:**\n\n**How Takaful Works:**\n* Participants pool funds to help each other\n* A tabarru (donation) portion goes into a mutual aid pool\n* A wakalah fee pays the takaful operator\n* Surplus distributed to participants or kept as reserves\n\n**Key Differences:**\n* Takaful: Halal, no investment in prohibited industries (gambling, alcohol)\n* Conventional: May invest in non-halal industries\n* Both provide equivalent protection\n\n**Malaysian Providers:** Etiqa Takaful, Prudential Takaful, Great Eastern Takaful, Manulife Takaful\n\nBoth are valid for Malaysian Muslims and non-Muslims.', suggestions: ['Compare Takaful vs conventional', 'Show Takaful products'] };
  }

  // Default
  const sug = getDefaultSuggestions();
  return { type: 'general' as const, response: 'I am your AI Insurance Strategist. I can help with:\n\n* Compare products - "Compare AIA vs Great Eastern"\n* Budget fitting - "What if budget is RM300?"\n* Coverage gaps - "Show gap analysis"\n* Sales tools - "Generate pitch script", "Objection handlers"\n* Technical questions - waiting periods, surrender values, underwriting, co-insurance, etc.\n\n' + (session && name !== 'there' ? 'I have ' + name + '\'s profile loaded (income: ' + (income ? fmt(income) + '/yr' : 'not set') + ', budget: ' + (budget ? fmt(budget) + '/mo' : 'not set') + '). ' : '') + 'Want me to run a full analysis with your client details?', suggestions: sug };
}


function getDefaultSuggestions() {
  return [
    'Show gap analysis',
    'Compare Great Eastern vs AIA',
    'Generate pitch script',
    'What if budget is RM300?',
    'Surrender value schedule',
    'Objection handlers for budget',
    'Explain co-insurance',
    'Waiting period for CI',
  ];
}

// ─── Main POST ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { sessionId, query } = await req.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const db = getDb();
    const q = query.toLowerCase();
    const type = classify(q);
    const session = await loadSession(db, sessionId);

    let result: Record<string, unknown> = { success: true, query, type };

    switch (type) {
      case 'compare': Object.assign(result, await handleCompare(db, q)); break;
      case 'budget': Object.assign(result, await handleBudget(db, q, session)); break;
      case 'pitch_script': Object.assign(result, handlePitchScript(session)); break;
      case 'surrender_value': Object.assign(result, handleSurrenderValue(session)); break;
      case 'underwriting': Object.assign(result, handleUnderwriting()); break;
      case 'lapse_reinstatement': Object.assign(result, handleLapseReinstatement()); break;
      case 'gap_analysis': Object.assign(result, handleGapAnalysis(session)); break;
      case 'illustration': Object.assign(result, handleIllustration(session)); break;
      case 'waiting_period': Object.assign(result, handleWaitingPeriod()); break;
      case 'covered_illness': Object.assign(result, handleCoveredIllness()); break;
      case 'premium_holiday': Object.assign(result, handlePremiumHoliday()); break;
      case 'breakeven': Object.assign(result, handleBreakeven(session)); break;
      case 'expat_eligibility': Object.assign(result, handleExpatEligibility()); break;
      case 'coverage_age': Object.assign(result, handleCoverageAge(session)); break;
      case 'pain_points': Object.assign(result, handlePainPoints(session)); break;
      case 'objection_handlers': Object.assign(result, handleObjectionHandlers()); break;
      case 'coinsurance': Object.assign(result, handleCoinsurance()); break;
      case 'guaranteed_vs_projected': Object.assign(result, handleGuaranteedVsProjected()); break;
      case 'product_detail': {
        const prods = session?.data?.recommendedProducts as Array<{ product: Prod; rank: number }> | undefined;
        result = { success: true, query, type: 'product_detail', message: 'Please specify a product name or select one from the sidebar.', products: prods || [] };
        break;
      }
      default: {
        result = handleGeneral(query, session);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[insurance/chat error]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
