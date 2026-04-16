import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { schema } from '@/lib/db/client';
import { eq, desc } from 'drizzle-orm';
import { verifySession } from '@/lib/auth';

// GET /api/financial/profile
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const clientId = session.clientId;
    const db = getDb();
    const [assetsResult, liabilitiesResult, snapshotsResult] = await Promise.all([
      db.select().from(schema.assets).where(eq(schema.assets.clientId, clientId)).execute(),
      db.select().from(schema.liabilities).where(eq(schema.liabilities.clientId, clientId)).execute(),
      db.select().from(schema.financialSnapshots).where(eq(schema.financialSnapshots.clientId, clientId)).orderBy(desc(schema.financialSnapshots.snapshotDate)).limit(1).execute(),
    ]);
    const assets = (assetsResult as Record<string, unknown>[]).map((a) => ({
      id: a.id,
      asset_type: a.assetType,
      name: a.name,
      value: a.value,
      created_at: a.createdAt,
    }));
    const liabilities = (liabilitiesResult as Record<string, unknown>[]).map((l) => ({
      id: l.id,
      liability_type: l.liabilityType,
      name: l.name,
      amount: l.amount,
      interest_rate: l.interestRate,
      created_at: l.createdAt,
    }));
    const snapshots = snapshotsResult;
    const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);
    const netWorth = totalAssets - totalLiabilities;
    const rawSnapshot = snapshots[0] ?? null;
    const latestSnapshot = rawSnapshot ? {
      id: rawSnapshot.id,
      monthly_income: rawSnapshot.monthlyIncome,
      monthly_expenses: rawSnapshot.monthlyExpenses,
      emergency_fund: rawSnapshot.emergencyFund,
      snapshot_date: rawSnapshot.snapshotDate,

    } : null;
    const monthlyIncome = latestSnapshot ? Number(latestSnapshot.monthly_income) : 0;
    const monthlyExpenses = latestSnapshot ? Number(latestSnapshot.monthly_expenses) : 0;
    const emergencyFund = latestSnapshot ? Number(latestSnapshot.emergency_fund ?? 0) : 0;
    const monthlySurplus = monthlyIncome - monthlyExpenses;
    const emergencyFundMonths = monthlyExpenses > 0 ? Math.round((emergencyFund / monthlyExpenses) * 10) / 10 : 0;
    const annualIncome = monthlyIncome * 12;
    const debtToIncomeRatio = annualIncome > 0 ? Math.round((totalLiabilities / annualIncome) * 100) / 100 : 0;
    return NextResponse.json({
      total_assets: Math.round(totalAssets * 100) / 100,
      total_liabilities: Math.round(totalLiabilities * 100) / 100,
      net_worth: Math.round(netWorth * 100) / 100,
      monthly_surplus: Math.round(monthlySurplus * 100) / 100,
      emergency_fund_months: emergencyFundMonths,
      debt_to_income_ratio: debtToIncomeRatio,
      latest_snapshot: latestSnapshot,
      assets,
      liabilities,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

