/**
 * GET /api/insurance/clients/[id]/profile
 * Returns full client profile for insurance analysis
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { getDb } from '@/lib/db/client';
import { clients, users, financialSnapshots, goals } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const drizzleDb = getDb();
  const libsqlClient = createClient({ url: process.env.DATABASE_URL || 'file:data/cfp_local.db' });
  const clientId = params.id;

  // Get client + user info
  const clientRow = await drizzleDb
    .select({
      clientId: clients.id,
      referenceId: clients.referenceId,
      fullName: clients.fullName,
      icNumber: clients.icNumber,
      dob: clients.dob,
      gender: clients.gender,
      age: clients.age,
      nationality: clients.nationality,
      maritalStatus: clients.maritalStatus,
      dependents: clients.dependents,
      annualIncome: clients.annualIncome,
       monthlyIncome: sql`(CASE WHEN annual_income IS NOT NULL THEN annual_income / 12 ELSE NULL END)`,
      phoneNumber: clients.phoneNumber,
      occupation: clients.occupation,
      employer: clients.employer,
      email: users.email,

    })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(eq(clients.id, clientId))
    .get();

  if (!clientRow) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Get latest financial snapshot
  const snapshot = await drizzleDb
    .select()
    .from(financialSnapshots)
    .where(eq(financialSnapshots.clientId, clientId))
    .orderBy(financialSnapshots.snapshotDate)
    .limit(1)
    .get();

  // Get goals
  const goalsList = await drizzleDb
    .select()
    .from(goals)
    .where(eq(goals.clientId, clientId))
    .all();

  // Determine monthly budget
   const budget = snapshot?.monthlyIncome
     || (clientRow.annualIncome ? clientRow.annualIncome / 12 / 4 : null); // 25% of monthly income max

  // Get existing policies
  const policies = await libsqlClient.execute({
    sql: `SELECT * FROM client_policies WHERE client_id = ? AND status = 'active'`,
    args: [clientId],
  });

  const existingPolicies = (policies.rows || []).map((p: Record<string, unknown>) => ({
    id: p.id,
    provider: p.provider,
    policyName: p.policy_name,
    policyType: p.policy_type,
    annualPremium: p.annual_premium,
    sumAssured: p.sum_assured,
    ciCover: p.ci_cover,
    medicalCover: p.medical_cover,
    lifeCover: p.life_cover,
    policyStartDate: p.policy_start_date,
  }));

  return NextResponse.json({
    profile: {
      ...clientRow,
      monthlyBudget: budget,
      financialSnapshot: snapshot ? {
        monthlyIncome: snapshot.monthlyIncome,
        monthlyExpenses: snapshot.monthlyExpenses,
        emergencyFund: snapshot.emergencyFund,
      } : null,
      goals: goalsList.map((g: Record<string, unknown>) => ({
        goalType: g.goalType,
        targetAmount: g.targetAmount,
        targetYear: g.targetYear,
        priority: g.priority,
      })),
      existingPolicies,
    },
  });
}

