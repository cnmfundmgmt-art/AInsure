/**
 * POST /api/insurance/analyze
 * Body: {
 *   clientData: { name, icNumber, dob, age, gender, nationality, income, dependents, monthlyBudget, riskProfile, goals, existingPolicies },
 *   sessionId?: string (for follow-up)
 * }
 * Returns full insurance analysis with session tracking
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { nanoid } from 'nanoid';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

function getDb() {
  return createClient({ url: DATABASE_URL });
}

// ─── Core calculations ─────────────────────────────────────────────────────────

function parseDOBFromIC(icNumber: string): string | null {
  if (!icNumber || icNumber.length < 6) return null;
  const yy = parseInt(icNumber.substring(0, 2));
  const mm = parseInt(icNumber.substring(2, 4));
  const dd = parseInt(icNumber.substring(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const cur = new Date().getFullYear() - 2000;
  const year = yy <= cur ? 2000 + yy : 1900 + yy;
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function calcAge(dob: string | null, icNumber: string | null): number {
  if (dob) {
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
    return Math.max(0, age);
  }
  if (icNumber) {
    const dobStr = parseDOBFromIC(icNumber);
    if (dobStr) {
      const dobDate = new Date(dobStr);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      return Math.max(0, age);
    }
  }
  return 0;
}

function calcRequiredCoverage(annualIncome: number, age: number) {
  const lifeMultiplier = age > 55 ? 5 : 8;
  return {
    lifeNeeded: annualIncome * lifeMultiplier,
    ciNeeded: Math.max(annualIncome * 3, 150000),
    medicalNeeded: 1000000,
  };
}

function calcGap(required: { lifeNeeded: number; ciNeeded: number; medicalNeeded: number }, existing: { lifeCover: number; ciCover: number; medicalCover: number }) {
  return {
    life: { required: required.lifeNeeded, existing: existing.lifeCover, gap: Math.max(0, required.lifeNeeded - existing.lifeCover) },
    ci: { required: required.ciNeeded, existing: existing.ciCover, gap: Math.max(0, required.ciNeeded - existing.ciCover) },
    medical: { required: required.medicalNeeded, existing: existing.medicalCover, gap: Math.max(0, required.medicalNeeded - existing.medicalCover) },
  };
}

interface Product {
  id: string; product_code: string; product_name: string; provider: string; policy_type: string;
  monthly_premium_min: number; coverage_amount_max: number; annual_premium: number;
  min_entry_age: number; max_entry_age: number; is_takaful: number;
  ci_cover: number; medical_cover: number;
  life_cover_10y: number; life_cover_20y: number; life_cover_30y: number;
  guaranteed_cash_10y: number; guaranteed_cash_20y: number; guaranteed_cash_30y: number;
  projected_cash_10y: number; projected_cash_20y: number; projected_cash_30y: number;
  payment_term_years: number; coverage_features: string; product_summary: string;
}

function rankProducts(products: Product[], gap: { life: { gap: number }; ci: { gap: number }; medical: { gap: number } }, budget: number, age: number): Product[] {
  return products
    .filter(p => age >= p.min_entry_age && age <= p.max_entry_age && p.monthly_premium_min <= budget * 1.15)
    .map(p => {
      let score = 0;
      if (gap.life.gap > 0 && p.life_cover_10y > 0) score += Math.min(p.life_cover_10y / gap.life.gap, 1) * 40;
      if (gap.ci.gap > 0 && p.ci_cover > 0) score += Math.min(p.ci_cover / gap.ci.gap, 1) * 35;
      if (gap.medical.gap > 0 && p.medical_cover > 0) score += Math.min(p.medical_cover / gap.medical.gap, 1) * 25;
      const budgetScore = Math.max(0, 1 - p.monthly_premium_min / budget);
      score += budgetScore * 20;
      return { product: p, score: Math.min(score, 100) };
    })
    .sort((a, b) => b.score - a.score)
    .map(r => r.product);
}

function fmt(n: number) {
  return 'RM' + n.toLocaleString('en-MY', { maximumFractionDigits: 0 });
}

function generatePitchScript(
  clientName: string, goal: string | null,
  lifeGap: number, ciGap: number, medicalGap: number,
  requiredLife: number, requiredCI: number,
  existingLife: number, existingCI: number, existingMed: number,
  topProduct: Product, monthlyPremium: number, budget: number
): string {
  const goalText = goal || 'protecting your family\'s financial future';
  const lg = lifeGap > 0 ? fmt(lifeGap) : 'Covered ✅';
  const cg = ciGap > 0 ? fmt(ciGap) : 'Covered ✅';
  const mg = medicalGap > 0 ? fmt(medicalGap) : 'Covered ✅';
  const totalGap = lifeGap + ciGap + medicalGap;

  return `## ${clientName}'s Insurance Recommendation

---

### 🎣 THE HOOK

${clientName}, you told me your goal is **${goalText}**. That's not just a financial target - it's about keeping the people you love safe no matter what happens.

Here's what I found after analyzing your situation...

---

### 📊 YOUR PROTECTION GAP

Based on industry standards used by professional financial advisors across Malaysia:

| Coverage Type | You Actually Need | You Currently Have | **Shortfall** |
|---|---|---|---|
| **Life Protection** | ${fmt(requiredLife)} | ${existingLife > 0 ? fmt(existingLife) : 'None'} | **${lg}** |
| **Critical Illness** | ${fmt(requiredCI)} | ${existingCI > 0 ? fmt(existingCI) : 'None'} | **${cg}** |
| **Medical / Hospital** | ${fmt(1000000)} | ${existingMed > 0 ? fmt(existingMed) : 'None'} | **${mg}** |

**Total unprotected gap: ${fmt(totalGap)}**

---

### 🏆 THE SOLUTION

**${topProduct.product_name}** from **${topProduct.provider}**
Monthly Premium: **RM${Math.round(monthlyPremium).toLocaleString('en-MY')}** (within your RM${Math.round(budget).toLocaleString('en-MY')}/month budget)

${topProduct.product_summary}

---

### 💪 HANDLING YOUR CONCERNS

**"It's too expensive for my budget right now."**

I hear you - and that's a valid concern. At RM${Math.round(monthlyPremium).toLocaleString('en-MY')}/month, that's about RM${Math.round(monthlyPremium / 30)} per day. But here's the reality check: if you passed away tomorrow without this coverage, your family would face a RM${fmt(totalGap)} shortfall immediately. We can also look at reducing the coverage slightly or extending the payment term to bring this within your comfort zone - but the key is starting today, because the cost of waiting is measured in risk, not money.

**"I need to think about it and check with my spouse."**

Absolutely - this is a big decision and your spouse should be involved. Here's what I'd ask you both to discuss this weekend: If one of you wasn't here in the next 5 years, would the other's income be enough to keep the house, fund the children's education, and maintain your current lifestyle? If the answer is anything less than a confident "yes," then you're not deciding *whether* to protect your family - you're just deciding *how*. I can prepare 2-3 options at different price points for you to review together.

---

*Generated by AI Insurance Strategist · CFP Malaysia*
`;
}

function generatePainPoints(
  clientName: string, age: number,
  lifeGap: number, ciGap: number, medicalGap: number,
  dependents: number, annualIncome: number, monthlyBudget: number,
  existingPolicies: Array<{ policyName: string; lifeCover: number }>,
  goal: string | null
): Array<{ id: string; title: string; description: string; financialImpact: string; urgency: 'high' | 'medium' | 'low' }> {
  const points = [];
  const monthlyIncome = annualIncome / 12;

  if (lifeGap > 0 && dependents > 0) {
    const monthlyShortfall = lifeGap / 60; // months family can sustain
    const yearsSurvive = Math.floor(monthlyShortfall / monthlyIncome * 12);
    points.push({
      id: 'life-gap',
      title: `Income Loss Risk - ${dependents} dependent${dependents > 1 ? 's' : ''} rely on ${clientName}'s income`,
      description: `If ${clientName} passed away tomorrow, the family loses their primary income. With a RM${fmt(lifeGap)} life cover gap, existing savings would need to cover mortgage, school fees, daily expenses, and future financial goals simultaneously.`,
      financialImpact: `RM${fmt(lifeGap)} shortfall - at current spending levels, the family would exhaust savings in approximately ${Math.max(1, Math.floor(monthlyShortfall / 12))} year${Math.floor(monthlyShortfall / 12) !== 1 ? 's' : ''}. Primary residence at risk of sale within ${Math.max(1, Math.ceil(monthlyShortfall / 12 / 5))} years.`,
      urgency: dependents >= 2 ? 'high' : 'medium',
    });
  } else if (lifeGap > 0) {
    points.push({
      id: 'life-single',
      title: `Life Cover Gap Leaves ${clientName} Unprotected`,
      description: `Despite having dependents, the current life coverage has a RM${fmt(lifeGap)} gap. If the unexpected happens, the family's financial stability would be immediately compromised.`,
      financialImpact: `RM${fmt(lifeGap)} unprotected - sufficient assets would need to be liquidated, potentially derailing retirement plans and long-term goals.`,
      urgency: 'high',
    });
  }

  if (ciGap > 0) {
    const recoveryCost = Math.round(ciGap * 0.5);
    const lostIncome = Math.round(ciGap * 0.4);
    points.push({
      id: 'ci-gap',
      title: `Critical Illness Creates 12-24 Month Income Gap`,
      description: `A serious illness (cancer, heart attack, stroke) requires 12-24 months of recovery. During that time, income stops but household expenses increase by 30-50% due to medical costs, supplements, and caretaker arrangements. ${clientName}'s CI coverage gap is RM${fmt(ciGap)}.`,
      financialImpact: `RM${fmt(ciGap)} lump sum needed - estimated RM${fmt(recoveryCost)} for treatment/recovery costs + RM${fmt(lostIncome)} in lost income during recovery period. Without CI coverage, recovery decisions may be compromised by financial pressure.`,
      urgency: 'high',
    });
  }

  if (medicalGap > 0) {
    const avgBill = Math.round(medicalGap * 0.3);
    const worstBill = Math.round(medicalGap * 0.6);
    points.push({
      id: 'medical-gap',
      title: `Private Hospital Bills Would Deplete Emergency Fund`,
      description: `A typical 7-day private hospital stay in Malaysia costs RM${fmt(avgBill)} to RM${fmt(worstBill)} depending on the condition. With ${medicalGap > 500000 ? 'a large' : 'a significant'} medical coverage gap of RM${fmt(medicalGap)}, any hospitalization would require significant out-of-pocket spending.`,
      financialImpact: `RM${fmt(medicalGap)} gap - single hospitalization event could cost RM${fmt(avgBill)}-RM${fmt(worstBill)}, depleting emergency savings that took years to build.`,
      urgency: dependents > 0 ? 'high' : 'medium',
    });
  }

  if (points.length < 3) {
    points.push({
      id: 'inflation-risk',
      title: `Inflation is Eroding the Real Value of Existing Coverage`,
      description: `Even the life cover already in place today will be worth significantly less in 20 years due to inflation. At 3% annual inflation, RM${fmt(lifeGap > 0 ? lifeGap : 500000)} in coverage has only ${Math.round(100 / Math.pow(1.03, 20))}% of today's purchasing power in 20 years.`,
      financialImpact: `Real value of current coverage declining ~3% per year - without increasing coverage annually, ${clientName} risks being underinsured relative to future living costs.`,
      urgency: age < 45 ? 'medium' : 'low',
    });
  }

  return points.slice(0, 3) as Array<{ id: string; title: string; description: string; financialImpact: string; urgency: 'high' | 'medium' | 'low' }>;
}

// ─── Chart data generator ──────────────────────────────────────────────────────

function generateCashValueChart(topProduct: Product, monthlyPremium: number): {
  labels: string[];
  guaranteed: number[];
  projected: number[];
  breakeven: number | null;
} {
  const labels = ['Year 5', 'Year 10', 'Year 15', 'Year 20', 'Year 25', 'Year 30'];
  const guaranteed = [
    Math.round(topProduct.guaranteed_cash_10y * 0.4),
    topProduct.guaranteed_cash_10y,
    Math.round((topProduct.guaranteed_cash_20y + topProduct.guaranteed_cash_10y) / 2),
    topProduct.guaranteed_cash_20y,
    Math.round((topProduct.guaranteed_cash_20y + topProduct.guaranteed_cash_30y) / 2),
    topProduct.guaranteed_cash_30y,
  ];
  const projected = [
    Math.round(topProduct.projected_cash_10y * 0.4),
    topProduct.projected_cash_10y,
    Math.round((topProduct.projected_cash_20y + topProduct.projected_cash_10y) / 2),
    topProduct.projected_cash_20y,
    Math.round((topProduct.projected_cash_20y + topProduct.projected_cash_30y) / 2),
    topProduct.projected_cash_30y,
  ];
  // Find breakeven year (guaranteed vs total paid)
  const annualPremium = monthlyPremium * 12;
  const breakeven = topProduct.guaranteed_cash_20y > 0
    ? Math.round(topProduct.guaranteed_cash_20y / annualPremium)
    : null;
  return { labels, guaranteed, projected, breakeven };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientData, sessionId } = body;

    if (!clientData) {
      return NextResponse.json({ error: 'clientData required' }, { status: 400 });
    }

    const {
      name, icNumber, dob, age: ageOverride,
      gender, nationality,
      income, dependents, monthlyBudget, riskProfile,
      goals: clientGoals,
      existingPolicies = [],
    } = clientData;

    if (!income || income <= 0) {
      return NextResponse.json({ error: 'Annual income is required for analysis' }, { status: 400 });
    }

    const db = getDb();

    // Determine age
    const age = ageOverride || calcAge(dob, icNumber);
    const budget = monthlyBudget || Math.max(150, income / 12 * 0.25);
    const primaryGoal = Array.isArray(clientGoals) ? clientGoals[0] : (clientGoals || null);

    // Existing coverage
    let existingLife = 0, existingCI = 0, existingMed = 0;
    for (const p of existingPolicies) {
      existingLife += (p.lifeCover as number) || (p.life_cover as number) || 0;
      existingCI += (p.ciCover as number) || (p.ci_cover as number) || 0;
      existingMed += (p.medicalCover as number) || (p.medical_cover as number) || 0;
    }

    // Calculate gap
    const required = calcRequiredCoverage(income, age);
    const gap = calcGap(required, { lifeCover: existingLife, ciCover: existingCI, medicalCover: existingMed });

    // Get products
    const productsRows = await db.execute({ sql: 'SELECT * FROM insurance_products', args: [] });
     const products = (productsRows.rows || []) as unknown as Product[];

    // Rank and get top 3
    const ranked = rankProducts(products, gap, budget, age);
    let top3: Product[] = ranked.slice(0, 3);

    // If no products found (e.g. age too high for available products), get closest age-eligible products
    if (top3.length === 0) {
      const ageEligible = products
        .filter(p => age >= p.min_entry_age && age <= p.max_entry_age)
        .sort((a, b) => a.monthly_premium_min - b.monthly_premium_min);
      top3 = ageEligible.slice(0, 3);
    }

    // Build recommended products with structured data
    const recommendedProducts = top3.map((p, i) => {
      const estimatedMonthly = Math.min(p.monthly_premium_min * 1.05, budget * (i === 0 ? 0.85 : i === 1 ? 0.65 : 0.45));
      const coverLife = p.life_cover_10y || p.coverage_amount_max;
      const coverCI = p.ci_cover;
      const coverMed = p.medical_cover;

      const needScore = [
        gap.life.gap > 0 && coverLife > 0 ? Math.min(coverLife / gap.life.gap, 1) * 100 : 0,
        gap.ci.gap > 0 && coverCI > 0 ? Math.min(coverCI / gap.ci.gap, 1) * 100 : 0,
        gap.medical.gap > 0 && coverMed > 0 ? Math.min(coverMed / gap.medical.gap, 1) * 100 : 0,
      ];
      const avgNeedScore = Math.round(needScore.reduce((a, b) => a + b, 0) / needScore.filter(s => s > 0).length || 0);

      return {
        rank: i + 1,
        product: {
          id: p.id,
          productCode: p.product_code,
          productName: p.product_name,
          provider: p.provider,
          policyType: p.policy_type,
          isTakaful: p.is_takaful === 1,
          monthlyPremium: Math.round(estimatedMonthly),
          annualPremium: Math.round(estimatedMonthly * 12),
          ciCover: coverCI,
          medicalCover: coverMed,
          lifeCover: coverLife,
          lifeCover10y: p.life_cover_10y,
          lifeCover20y: p.life_cover_20y,
          lifeCover30y: p.life_cover_30y,
          guaranteedCash: {
            y10: p.guaranteed_cash_10y, y20: p.guaranteed_cash_20y, y30: p.guaranteed_cash_30y,
          },
          projectedCash: {
            y10: p.projected_cash_10y, y20: p.projected_cash_20y, y30: p.projected_cash_30y,
          },
          coverageFeatures: p.coverage_features ? JSON.parse(p.coverage_features) : [],
          paymentTermYears: p.payment_term_years,
          productSummary: p.product_summary,
          needMatchScore: avgNeedScore,
        },
        advisorNote: i === 0
          ? `${p.product_name} from ${p.provider} is the #1 match for this client - ${p.product_summary} It covers ${[
              gap.life.gap > 0 ? `${fmt(gap.life.gap)} life gap` : null,
              gap.ci.gap > 0 ? `${fmt(gap.ci.gap)} CI gap` : null,
              gap.medical.gap > 0 ? `${fmt(gap.medical.gap)} medical gap` : null,
            ].filter(Boolean).join(', ')} within budget.`
          : `${p.product_name} is the #${i + 1} recommendation at RM${Math.round(estimatedMonthly).toLocaleString('en-MY')}/month - best value among remaining alternatives.`,
      };
    });

    // Pitch script
    const pitchScript = top3[0]
      ? generatePitchScript(name || 'Client', primaryGoal, gap.life.gap, gap.ci.gap, gap.medical.gap, required.lifeNeeded, required.ciNeeded, existingLife, existingCI, existingMed, top3[0], recommendedProducts[0]?.product.monthlyPremium || budget, budget)
      : null;

    // Pain points
    const painPoints = generatePainPoints(
      name || 'Client', age, gap.life.gap, gap.ci.gap, gap.medical.gap,
      dependents || 0, income, monthlyBudget || budget,
      existingPolicies as Array<{ policyName: string; lifeCover: number }>,
      primaryGoal,
    );

    // Cash value chart data
    const cashValueChart = top3[0] && top3[0].guaranteed_cash_20y > 0
      ? generateCashValueChart(top3[0], recommendedProducts[0]?.product.monthlyPremium || budget)
      : null;

    // Save session
    const newSessionId = sessionId || nanoid();
    const analysisData = JSON.stringify({
      clientData, gap, recommendedProducts, pitchScript, painPoints, cashValueChart,
    });
    try {
      await db.execute({
        sql: `INSERT INTO insurance_analysis_sessions
              (id, advisor_id, client_name, client_ic, annual_income, monthly_budget, analysis_data, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [newSessionId, 'current-advisor', name || 'Unknown', icNumber || '', income, budget, analysisData, Math.floor(Date.now() / 1000)],
      });
    } catch (_) {
      // Session save is best-effort
    }

    // Special notes
    const notes: string[] = [];
    if (age > 55) notes.push('⚠️ Client is over 55 - life insurance multiple reduced to 5× income. Critical illness options are significantly limited at this age. Consider whole life or CI-limited products.');
    if (!nationality || nationality.toLowerCase() !== 'malaysian') notes.push('⚠️ Non-Malaysian client - international coverage should be factored in. Some products may have residency restrictions.');
    if (existingPolicies.length === 0) notes.push('i️ Client has no existing policies. The full protection gap equals the total required coverage amount.');
    if (riskProfile === 'aggressive') notes.push('💡 Client has an aggressive risk profile - consider investment-linked products with higher growth potential alongside pure protection.');
    if (dependents && dependents >= 3) notes.push(`⚠️ ${dependents} dependents - ensure coverage adequately covers education costs and long-term care needs.`);

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      client: {
        name, age, gender, nationality,
        icNumber, dob,
        income, dependents, monthlyBudget: budget, riskProfile,
        goals: primaryGoal,
      },
      calculationBasis: {
        lifeMultiple: age > 55 ? 5 : 8,
        ciMultiple: 3,
        medicalMin: 1000000,
        formula: 'Life = Income × 8 (age ≤55) or × 5 (age >55) | CI = Income × 3 (min RM150k) | Medical = RM1M minimum',
      },
      gapAnalysis: gap,
      existingPolicies: existingPolicies.map((p: Record<string, unknown>) => ({
        provider: p.provider || p.policyName,
        policyName: p.policyName || p.policy_name,
        annualPremium: p.annualPremium || p.annual_premium || 0,
        lifeCover: p.lifeCover || p.life_cover || 0,
        ciCover: p.ciCover || p.ci_cover || 0,
        medicalCover: p.medicalCover || p.medical_cover || 0,
      })),
      recommendedProducts,
      cashValueChart,
      pitchScript,
      painPoints,
      notes,
    });
  } catch (err) {
    console.error('[insurance/analyze error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
