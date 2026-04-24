import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/anthropic/v1';
const MINIMAX_FILE_URL = 'https://api.minimax.io/v1/files/upload';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
}

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

interface CatalogData {
  products: Product[];
  fields: Record<string, Record<string, string>>;
}

// ─── Load catalog ──────────────────────────────────────────────────────────────

async function loadCatalog(): Promise<CatalogData> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const p = path.join(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw);
      return {
        products: data.products || [],
        fields: data.fields || {}
      };
    }
  } catch { /* ignore */ }
  return { products: [], fields: {} };
}

function getDb() {
  return createClient({ url: DATABASE_URL });
}

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n as number)) return 'N/A';
  return 'RM' + (n as number).toLocaleString('en-MY', { maximumFractionDigits: 0 });
}

// ─── MiniMax call ──────────────────────────────────────────────────────────────

async function callMiniMaxStream(system: string, user: string, callback: (text: string) => void, maxTokens = 2048): Promise<void> {
  console.log('[MiniMax] Streaming...');
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
      stream: true,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MiniMax ${res.status}: ${err.slice(0, 200)}`);
  }

  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            callback(event.delta.text || '');
          }
        } catch { /* ignore parse errors */ }
      }
    }
  }
}

async function uploadFileToMinimax(filename: string, mimeType: string, data: string): Promise<string> {
  const binary = Buffer.from(data, 'base64');
  const form = new FormData();
  form.append('purpose', 't2a_async_input');
  form.append('file', new Blob([binary], { type: mimeType }), filename);
  console.log('[Minimax] Uploading file:', filename, mimeType, 'size:', binary.length);
  const res = await fetch(MINIMAX_FILE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MINIMAX_API_KEY}` },
    body: form,
  });
  const errText = await res.text();
  console.log('[Minimax] Upload response:', res.status, errText.slice(0, 300));
  if (!res.ok) {
    throw new Error(`File upload failed ${res.status}: ${errText.slice(0, 200)}`);
  }
  const result = JSON.parse(errText);
  return result.file?.file_id;
}

// ─── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(products: Product[], fields: Record<string, Record<string, string>>) {
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
      lines.push(`- **${p['Product Name'] || 'Unnamed'}** (${p['Provider'] || 'N/A'}) | SA: ${p['Min. SA'] || 'Varies'} | Prem: ${p['Min. Premium'] || 'Varies'} | Entry: ${p['Min Entry Age'] && p['Max Entry Age'] ? p['Min Entry Age'] + '-' + p['Max Entry Age'] : 'Varies'} | Coverage: ${p['Coverage Term'] || 'Varies'} | ${p['Par / Non-Par'] || ''} ${p['IL / Non-IL'] || ''} | ${String(p['Key Features'] || '').slice(0, 80)}`);
    }
    if (prods.length > 40) lines.push(`  ... and ${prods.length - 40} more ${cat} products`);
  }

  lines.push(`
## Field Descriptions\nUse these descriptions to explain product fields to the client:\n`);
  for (const [cat, fieldDescs] of Object.entries(fields) as [string, Record<string, string>][]) {
    if (!cat || Object.keys(fieldDescs).length === 0) continue;
    lines.push(`\n### ${cat.replace(/_/g, ' ').toUpperCase()} Fields`);
    for (const [field, desc] of Object.entries(fieldDescs)) {
      lines.push(`- **${field}**: ${desc}`);
    }
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

## Output Format
- Use MARKDOWN format only. DO NOT output JSON.
- Structure your response with clear headings, bullet points, and markdown tables
- Use proper markdown table syntax with separator rows (|---|---|)
- Include emoji sparingly for emphasis

## Gap Calculation Rules (Malaysia context)
- Life cover needed: income × 8 (age ≤55) or × 5 (age >55)
- CI cover needed: income × 3, minimum RM150,000
- Medical/Hospital: minimum RM1,000,000 (private hospital)
- Budget constraint: monthly premium must fit within client's stated budget

`);

  return lines.join('\n');
}

// ─── Build user prompt ─────────────────────────────────────────────────────────

function buildUserPrompt(client: Record<string, unknown>, existingText: string, query?: string, historyContext?: string, attachments?: Attachment[]) {
  const querySection = query ? `\n\n## Current User Question\nThe advisor is asking: "${query}"\nAnswer this specific question based on the client profile and product catalog above.` : '';
  const attachmentSection = attachments && attachments.length > 0
    ? `\n\n## Attached Files\nThe user has attached ${attachments.length} file(s) for your analysis:\n${attachments.map((a, i) => `### File ${i + 1}: ${a.name} (${a.type}, ${a.size} bytes)\n\`\`\`\n${Buffer.from(a.data, 'base64').toString('utf-8').slice(0, 5000)}\n\`\`\``).join('\n\n')}`
    : '';
  return `## Client Profile
- Name: ${client.name || 'Client'}
- Age: ${client.age} years old${historyContext || ''}
- Gender: ${client.gender || 'Not specified'}
- Annual Income: RM ${Number(client.income || 0).toLocaleString()}
- Monthly Budget: RM ${Number(client.monthlyBudget || 0).toLocaleString()}
- Dependents: ${client.dependents || 0}
- Goals: ${client.goals || 'Not specified'}
- Existing Policies: ${existingText}${querySection}${attachmentSection}

Provide your AI-powered insurance recommendations`;
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
      attachments?: Attachment[];
    };

    const { client, query, attachments } = body;
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
    const systemPrompt = buildSystemPrompt(catalog.products, catalog.fields);

    const userPrompt = buildUserPrompt(client, existingText, query, historyContext);

    let fullText = '';

    try {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (attachments && attachments.length > 0) {
              const fileIds: string[] = [];
              for (const att of attachments) {
                try {
                  const fileId = await uploadFileToMinimax(att.name, att.type, att.data);
                  if (fileId) fileIds.push(fileId);
                } catch (e) { console.error('[Minimax] File upload error:', e); }
              }
              if (fileIds.length > 0) {
                const fileRefText = `\n\n## Attached Files\nThe user has uploaded ${fileIds.length} file(s) for your analysis.\nFiles: ${fileIds.join(', ')}`;
                await callMiniMaxStream(systemPrompt, userPrompt + fileRefText, (text) => {
                  controller.enqueue(encoder.encode(text));
                  fullText += text;
                }, 2048);
              } else {
                await callMiniMaxStream(systemPrompt, userPrompt, (text) => {
                  controller.enqueue(encoder.encode(text));
                  fullText += text;
                }, 2048);
              }
            } else {
              await callMiniMaxStream(systemPrompt, userPrompt, (text) => {
                controller.enqueue(encoder.encode(text));
                fullText += text;
              }, 2048);
            }
          } catch (e) {
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (llmErr) {
      return NextResponse.json({
        success: false,
        error: (llmErr as Error).message,
        fallback: true,
        catalogSummary: {
          totalProducts: catalog.products.length,
          byCategory: {
            life: catalog.products.filter((p: Product) => p.category === 'life').length,
            critical_illness: catalog.products.filter((p: Product) => p.category === 'critical_illness').length,
            medical: catalog.products.filter((p: Product) => p.category === 'medical').length,
            savings: catalog.products.filter((p: Product) => p.category === 'savings_endowment_retirement').length,
          },
        },
        message: 'MiniMax unavailable. Showing catalog summary instead.',
      });
    }
  } catch (err) {
    console.error('[recommend] error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
