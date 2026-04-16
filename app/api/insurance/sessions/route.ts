/**
 * GET /api/insurance/sessions
 * Returns past analysis sessions for the current advisor
 * Query: limit (default 20), offset (default 0)
 */
import { NextRequest, NextResponse } from 'next/server';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@libsql/client');
  return createClient({ url: DATABASE_URL });
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const countRows = await db.execute({
      sql: 'SELECT COUNT(*) as total FROM insurance_analysis_sessions',
      args: [],
    });
    const total = (countRows.rows?.[0] as Record<string, unknown>)?.total as number || 0;

    const rows = await db.execute({
      sql: `SELECT id, client_name, client_ic, annual_income, monthly_budget, created_at
            FROM insurance_analysis_sessions
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });

    const sessions = (rows.rows || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      clientName: row.client_name as string,
      clientIC: (row.client_ic as string)?.replace(/.(?=.{4})/g, '*'), // mask IC
      annualIncome: row.annual_income as number,
      monthlyBudget: row.monthly_budget as number,
      createdAt: row.created_at as number,
      date: new Date((row.created_at as number) * 1000).toLocaleDateString('en-MY', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    }));

    return NextResponse.json({ sessions, total, limit, offset });
  } catch (err) {
    console.error('[sessions error]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
