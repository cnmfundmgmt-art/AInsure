/**
 * GET /api/insurance/sessions
 * Returns past analysis sessions for the current advisor
 * Query: limit (default 20), offset (default 0)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { insuranceAnalysisSessions } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(insuranceAnalysisSessions).get();
    const total = countResult?.count || 0;

    const rows = await db.select({
      id: insuranceAnalysisSessions.id,
      clientName: insuranceAnalysisSessions.clientName,
      clientIC: insuranceAnalysisSessions.clientIC,
      annualIncome: insuranceAnalysisSessions.annualIncome,
      monthlyBudget: insuranceAnalysisSessions.monthlyBudget,
      createdAt: insuranceAnalysisSessions.createdAt,
    })
      .from(insuranceAnalysisSessions)
      .orderBy(desc(insuranceAnalysisSessions.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    const sessions = rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      clientName: (row.clientName as string) || '',
      clientIC: (row.clientIC as string)?.replace(/.(?=.{4})/g, '*') || '',
      annualIncome: row.annualIncome as number,
      monthlyBudget: row.monthlyBudget as number,
      createdAt: row.createdAt as number,
      date: new Date((row.createdAt as number) * 1000).toLocaleDateString('en-MY', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    }));

    return NextResponse.json({ sessions, total, limit, offset });
  } catch (err) {
    console.error('[sessions error]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}