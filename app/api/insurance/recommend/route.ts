import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/anthropic/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  provider: string;
  type: 'term' | 'whole-life' | 'takaful' | 'endowment' | 'ilp' | 'medical' | 'critical-illness';
  category: 'life' | 'critical_illness' | 'medical' | 'savings_endowment_retirement';
  entryAgeMin: number | null;
  entryAgeMax: number | null;
  minSumAssuredAmount: number | null;
  minPremiumAmount: number | null;
  coverageTermParsed: { type: string; value: number | null } | null;
  parNonPar: string;
  ilNonIl: string;
  riders: string;
  tpd: string;
  convertible: string;
  renewable: string;
  keyFeatures: string;
  [key: string]: unknown;
}

// ─── Load catalog ──────────────────────────────────────────────────────────────

async function loadCatalog(): Promise<Product[]> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const p = path.join(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw);
      return data.products || [];
    }
  } catch { /* ignore */ }
  return [];
}

function getDb() {
  return createClient({ url: DATABASE_URL });
}

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n as number)) return 'N/A';
  return 'RM' + (n as number).toLocaleString('en-MY', { maximumFractionDigits: 0 });
}

// ─── MiniMax call ──────────────────────────────────────────────────────────────

async function callMiniMax(system: string, user: string, maxTokens = 2048): Promise<string> {
  const res = await fetch(`${MINIMAX_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-UX': 'true',
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.7',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MiniMax ${res.status}: ${err.slice(0, 200)}`);
  }

  let data: { content?: Array<{ type: string; text?: string }> };
  try {
    data = await res.json();
  } catch {
    throw new Error('Non-JSON from MiniMax: ' + (await res.text()).slice(0, 200));
  }

  const textBlocks = data.content?.filter((b) => b.type === 'text') ?? [];
  return textBlocks.map((b) => b.text ?? '').join('\n');
}

// ─── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(products: Product[]) {
  const byCategory = {
    life: products.filter((p) => p.category === 'life'),
    critical_illness: products.filter((p) => p.category === 'critical_illness'),
    medical: products.filter((p) => p.category === 'medical'),
    savings_endowment_retirement: products.filter((p) => p.category === 'savings_endowment_retirement'),
  };

  const lines: string[] = [
    `You are a CFP (Certified Financial Planner) advisor in Malaysia specializing in insurance.`,
    `You are empathetic, professional, and always act in the client's best interest.`,
    `You explain complex concepts in plain language — no jargon.`,
    ``,
    `## Product Catalog`,
  ];

  for (const [cat, prods] of Object.entries(byCategory) as [string, Product[]][]) {
    if (!prods.length) continue;
    lines.push(`\n### ${cat.replace(/_/g, ' ').toUpperCase()} (${prods.length} products)`);
    for (const p of prods.slice(0, 40)) {
      const sa = p.minSumAssuredAmount != null ? fmt(p.minSumAssuredAmount) : 'Varies';
      const prem = p.minPremiumAmount != null ? fmt(p.minPremiumAmount) + '/yr' : 'Varies';
      const age = p.entryAgeMin != null && p.entryAgeMax != null ? `${p.entryAgeMin}-${p.entryAgeMax}` : 'Varies';
      const coverage = p.coverageTermParsed?.value != null
        ? (p.coverageTermParsed.type === 'lifetime' ? 'Lifetime' : `${p.coverageTermParsed.value} yrs`)
        : (p.coverageTermParsed?.type === 'unknown' ? 'Varies' : 'Varies');
      const features = p.keyFeatures ? p.keyFeatures.slice(0, 100) : '';
      lines.push(`- **${p.name}** (${p.provider}) | Entry: ${age} | SA: ${sa} | Prem: ${prem} | Coverage: ${coverage} | ${features}`);
    }
    if (prods.length > 40) lines.push(`  ... and ${prods.length - 40} more ${cat} products`);
  }

  lines.push(`
## Your Task
Given a client's profile, you MUST:
1. Identify which categories they need (life protection, CI, medical, savings)
2. Calculate the protection gap (life: 8× income or 5× if age >55; CI: 3× income min RM150k; medical: RM1M)
3. Recommend specific products from the catalog — ONLY ones the client is eligible for
4. Explain WHY each product fits their specific situation
5. Flag any concerns (age, budget, health)
6. Suggest next steps

## Gap Calculation Rules (Malaysia context)
- Life cover needed: income × 8 (age ≤55) or × 5 (age >55)
- CI cover needed: income × 3, minimum RM150,000
- Medical/Hospital: minimum RM1,000,000 (private hospital)
- Budget constraint: monthly premium must fit within client's stated budget

## Response Format (STRICT JSON — return only valid JSON)
{
  "summary": "2-3 sentence overall strategy for this client",
  "gapAnalysis": {
    "life": { "required": number, "existing": number, "gap": number },
    "ci": { "required": number, "existing": number, "gap": number },
    "medical": { "required": number, "existing": number, "gap": number }
  },
  "recommendations": [
    {
      "productId": "life-5",
      "productName": "Product Name",
      "category": "life|critical_illness|medical|savings",
      "reason": "Why this product fits this client specifically",
      "estimatedPremium": "RM X,XXX/yr",
      "sumAssured": "RM XXX,XXX",
      "priority": "essential|recommended|optional",
      "keySellingPoints": ["point1", "point2"]
    }
  ],
  "concerns": ["concern1", "concern2"],
  "nextSteps": ["step1", "step2"]
}
`);

  return lines.join('\n');
}

// ─── Build user prompt ─────────────────────────────────────────────────────────

function buildUserPrompt(client: Record<string, unknown>, existingText: string, query?: string, historyContext?: string) {
  const querySection = query ? `\n\n## Current User Question\nThe advisor is asking: "${query}"\nAnswer this specific question based on the client profile and product catalog above.` : '';
  return `## Client Profile
- Name: ${client.name || 'Client'}
- Age: ${client.age} years old${historyContext || ''}
- Gender: ${client.gender || 'Not specified'}
- Annual Income: RM ${Number(client.income || 0).toLocaleString()}
- Monthly Budget: RM ${Number(client.monthlyBudget || 0).toLocaleString()}
- Dependents: ${client.dependents || 0}
- Goals: ${client.goals || 'Not specified'}
- Existing Policies: ${existingText}${querySection}

Provide your AI-powered insurance recommendations in the required JSON format.`;
}

// ─── Save session ──────────────────────────────────────────────────────────────

async function saveSession(
  db: ReturnType<typeof getDb>,
  sessionId: string | null,
  clientData: Record<string, unknown>,
  llmResponse: Record<string, unknown>
) {
  const id = sessionId || crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: `INSERT OR REPLACE INTO insurance_analysis_sessions (id, advisor_id, client_name, annual_income, monthly_budget, analysis_data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      'current-advisor',
      (clientData.name as string) || 'Unknown',
      Number(clientData.income || 0),
      Number(clientData.monthlyBudget || 0),
      JSON.stringify({ clientData, llmResponse }),
      now,
    ],
  });
  return id;
}

// ─── POST /api/insurance/recommend ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const catalog = await loadCatalog();

    const body = await req.json() as {
      client: Record<string, unknown>;
      sessionId?: string;
      query?: string;
    };

    const { client, query } = body;
    if (!client || !client.age || !client.income) {
      return NextResponse.json({ error: 'Missing age or income' }, { status: 400 });
    }

    const existingPolicies = (client.existingPolicies as Array<{ policyType: string; sumAssured: number; premium: number }>) || [];
    const existingText = existingPolicies.length > 0
      ? existingPolicies.map((p) => `- ${p.policyType}: RM ${p.sumAssured.toLocaleString()} sum assured, RM ${p.premium.toLocaleString()}/yr`).join('\n')
      : 'None';

    // History context disabled for speed — re-enable if session continuity is needed
    let historyContext = '';
    // try {
    //   const db = getDb();
    //   const sessionRows = await db.execute({
    //     sql: `SELECT client_name, analysis_data, created_at
    //           FROM insurance_analysis_sessions
    //           WHERE client_name = ? AND id != ?
    //           ORDER BY created_at DESC LIMIT 1`,
    //     args: [(client.name as string) || 'Unknown', body.sessionId || ''],
    //   });
    //   if (sessionRows.rows && sessionRows.rows.length > 0) { ... }
    // } catch { /* ignore */ }
    const systemPrompt = buildSystemPrompt(catalog);
    const userPrompt = buildUserPrompt(client, existingText, query, historyContext);

    let llmText = '';
    try {
      llmText = await callMiniMax(systemPrompt, userPrompt, 2048);
    } catch (llmErr) {
      // Fallback: return catalog info for manual selection
      return NextResponse.json({
        success: false,
        error: (llmErr as Error).message,
        fallback: true,
        catalogSummary: {
          totalProducts: catalog.length,
          byCategory: {
            life: catalog.filter((p) => p.category === 'life').length,
            critical_illness: catalog.filter((p) => p.category === 'critical_illness').length,
            medical: catalog.filter((p) => p.category === 'medical').length,
            savings: catalog.filter((p) => p.category === 'savings_endowment_retirement').length,
          },
        },
        message: 'MiniMax unavailable. Showing catalog summary instead.',
      });
    }

    // Parse JSON from LLM response
    let parsed: Record<string, unknown> = {};
    let rawText = '';
    try {
      const match = llmText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
        // Extract the text portion before the JSON code block (the actual conversational answer)
        const jsonStart = llmText.indexOf(match[0]);
        const textBefore = llmText.slice(0, jsonStart).replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        rawText = textBefore.length > 0 ? textBefore : '';
      } else {
        rawText = llmText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        parsed = {};
      }
    } catch {
      rawText = llmText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      parsed = {};
    }

    // Remove any nested `raw` key that the LLM nested inside the JSON itself
    delete parsed.raw;

    // Save session
    const db = getDb();
    const newSessionId = await saveSession(db, body.sessionId || null, client, parsed);

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      client,
      content: rawText || null,
      analysis: {
        summary: parsed.summary as string ?? null,
        gapAnalysis: parsed.gapAnalysis as object ?? null,
        recommendations: parsed.recommendations as Array<unknown> ?? [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      },
    });
  } catch (err) {
    console.error('[recommend] error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
