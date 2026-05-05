import { getDb } from '@/lib/db/client';
import { chatMessages } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const MAX_CONTEXT_MESSAGES = 20;

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/anthropic/v1';

export interface ChatRequest {
  sessionId: string;
  message: string;
  clientContext?: {
    name?: string;
    income?: number;
    dependents?: number;
    monthlyBudget?: number;
    existingPolicies?: Array<{ policyName: string; lifeCover: number; ciCover: number; medicalCover: number }>;
    goals?: string[];
  };
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
}

function buildSystemPrompt(): string {
  return `You are an expert Islamic financial advisor (CFP Malaysia) specializing in takaful and insurance planning. You help clients understand their protection needs, recommend suitable coverage, and answer insurance-related questions.

Guidelines:
- Respond in Malay or English based on client preference
- Use emojis sparingly but effectively (🛡️, 💰, ✅, ⚠️)
- Format responses with markdown tables, headers, and bullet points
- Always disclose that you are an AI assistant and recommendations should be verified with a licensed advisor
- Do not provide specific premium quotes without complete client data
- Be empathetic and clear — avoid jargon without explanation
- For comprehensive analysis requests, recommend the full insurance needs analysis
- Never ask for NRIC number or full personal identification
- Prioritize takaful products for Muslim clients unless they specifically prefer conventional insurance`;
}

function scoreCoverageGap(
  income: number,
  existingPolicies: Array<{ policyName: string; lifeCover: number; ciCover: number; medicalCover: number }>
): { lifeGap: number; ciGap: number; medicalGap: number } {
  const lifeNeeded = income * 8;
  const ciNeeded = Math.max(income * 3, 150000);
  const medicalNeeded = 1000000;

  let existingLife = 0, existingCI = 0, existingMed = 0;
  for (const p of existingPolicies) {
    existingLife += p.lifeCover || 0;
    existingCI += p.ciCover || 0;
    existingMed += p.medicalCover || 0;
  }

  return {
    lifeGap: Math.max(0, lifeNeeded - existingLife),
    ciGap: Math.max(0, ciNeeded - existingCI),
    medicalGap: Math.max(0, medicalNeeded - existingMed),
  };
}

function buildContextAwareSystem(sessionId: string, clientContext?: ChatRequest['clientContext']): string {
  let base = buildSystemPrompt();
  if (!clientContext) return base;

  const { name, income, existingPolicies = [], goals } = clientContext;
  let extra = '\n\n## Client Context (if available)\n';
  if (name) extra += `- Client name: ${name}\n`;
  if (income) {
    const gaps = scoreCoverageGap(income, existingPolicies);
    extra += `- Annual income: RM${income.toLocaleString('en-MY')}\n`;
    extra += `- Life cover gap: RM${gaps.lifeGap.toLocaleString('en-MY')}\n`;
    extra += `- CI cover gap: RM${gaps.ciGap.toLocaleString('en-MY')}\n`;
    extra += `- Medical cover gap: RM${gaps.medicalGap.toLocaleString('en-MY')}\n`;
  }
  if (goals && goals.length > 0) extra += `- Client goals: ${goals.join(', ')}\n`;
  extra += '- This context is provided for advisory purposes — always verify with the client.\n';

  return base.replace('\n\nGuidelines:', extra + '\n\nGuidelines:');
}

async function callMiniMax(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    return '⚠️ AI advisor is not configured. Please set MINIMAX_API_KEY in your environment.';
  }

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
      max_tokens: 8192,
      stream: false,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[chat service] LLM error:', err);
    return '⚠️ AI advisor encountered an error. Please try again or contact support.';
  }

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.[0]?.text;
  return text || 'No response received.';
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const db = getDb();
  const { sessionId, message, clientContext } = req;

  const now = Math.floor(Date.now() / 1000);

  await db.insert(chatMessages).values({
    id: nanoid(),
    sessionId,
    role: 'user',
    content: message,
    metadata: null,
    createdAt: now,
  }).run();

  const historyRows = await db
    .select({ role: chatMessages.role, content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .limit(MAX_CONTEXT_MESSAGES)
    .all();

  const systemPrompt = buildContextAwareSystem(sessionId, clientContext);

  const llmMessages = historyRows
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const reply = await callMiniMax(systemPrompt, llmMessages.length > 0 ? llmMessages : [{ role: 'user', content: message }]);

  await db.insert(chatMessages).values({
    id: nanoid(),
    sessionId,
    role: 'assistant',
    content: reply,
    metadata: JSON.stringify({ model: 'MiniMax-M2.7' }),
    createdAt: Math.floor(Date.now() / 1000),
  }).run();

  return { sessionId, reply };
}