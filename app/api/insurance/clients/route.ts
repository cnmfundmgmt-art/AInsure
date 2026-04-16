/**
 * GET /api/insurance/clients/search?q=query
 * Search clients by name, email, IC number, or reference ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { clients, users, financialSnapshots, goals } from '@/lib/db/schema';
import { eq, like, or, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  const db = getDb();

  let rows;
  if (!q.trim()) {
    // Return recent clients
    rows = await db
      .select({
        clientId: clients.id,
        referenceId: clients.referenceId,
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        age: clients.age,
        gender: clients.gender,
        nationality: clients.nationality,
        email: users.email,
        annualIncome: clients.annualIncome,
        dependents: clients.dependents,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .orderBy(desc(clients.createdAt))
      .limit(20)
      .all();
  } else {
    const term = `%${q}%`;
    rows = await db
      .select({
        clientId: clients.id,
        referenceId: clients.referenceId,
        fullName: clients.fullName,
        icNumber: clients.icNumber,
        dob: clients.dob,
        age: clients.age,
        gender: clients.gender,
        nationality: clients.nationality,
        email: users.email,
        annualIncome: clients.annualIncome,
        dependents: clients.dependents,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(
        or(
          like(clients.fullName, term),
          like(users.email, term),
          like(clients.icNumber, term),
          like(clients.referenceId, term),
        )
      )
      .orderBy(desc(clients.createdAt))
      .limit(20)
      .all();
  }

  return NextResponse.json({ clients: rows });
}
