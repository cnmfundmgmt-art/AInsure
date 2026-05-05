'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield, ChevronLeft, ChevronRight, Loader2, CheckCircle, Send,
  Heart, Stethoscope, Package, Menu, Paperclip, X, User, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

// --- Types ---

interface AdvisorClient {
  id: string;
  clientNumber: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
}

interface ClientData {
  name: string;
  age: number;
  gender: 'male' | 'female';
  annualIncome: number;
  smoker: boolean;
  monthlyBudget: number;
  coverageTerm: number;
  intendSumAssured: number;
  dependents: number;
  existingLifeCover: number;
  existingCICover: number;
  existingMedicalCover: number;
  existingEndowmentCover: number;
  investmentPreference: 'investment-linked' | 'non-investment-linked' | null;
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  type?: string;
  attachments?: Attachment[];
};

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
};

// --- Helpers ---

function fmt(n: number) {
  return 'RM' + n.toLocaleString('en-MY');
}

function fmtBudget(n: number) {
  return 'RM' + n.toLocaleString('en-MY') + '/mo';
}

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s+/g, '')       // headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')      // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\|/g, ' ')               // table pipes
    .replace(/[-–—]{2,}/g, ' ')        // hr/dashes
    .replace(/\n{2,}/g, ' ')           // multiple newlines
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SUGGESTIONS = [
  'Show gap analysis',
  'Compare Great Eastern vs AIA',
  'Generate pitch script',
  'What if budget is RM300?',
  'Surrender value schedule',
  'Objection handlers for budget',
];

// --- Client mapper for API ---


function buildClientForAPI(form: ClientData) {
  return {
    name: form.name,
    age: form.age,
    gender: form.gender,
    income: form.annualIncome,
    monthlyBudget: form.monthlyBudget,
    budget: form.monthlyBudget,
    dependents: form.dependents,
    smoker: form.smoker,
    coverageTerm: form.coverageTerm,
    intendSumAssured: form.intendSumAssured,
    investmentPreference: form.investmentPreference || 'not specified',
    existingPolicies: [
      form.existingLifeCover > 0 ? { policyType: 'Life', sumAssured: form.existingLifeCover, premium: 0 } : null,
      form.existingCICover > 0 ? { policyType: 'CI', sumAssured: form.existingCICover, premium: 0 } : null,
      form.existingMedicalCover > 0 ? { policyType: 'Medical', sumAssured: form.existingMedicalCover, premium: 0 } : null,
    ].filter(Boolean) as Array<{ policyType: string; sumAssured: number; premium: number }>,
  };
}

// --- Message renderer ---


function renderAssistantResponse(data: Record<string, unknown>, query: string) {
  const lines: string[] = [];


  // Category recommendation with explanation
  const categoryRec = data.categoryRecommendation as string | undefined;
  if (categoryRec) {
    lines.push(`**Recommended Category:** ${categoryRec}\n`);
  }


  // Gap analysis - conversational
  const gap = data.gapAnalysis as Record<string, Record<string, number>> | undefined;
  if (gap) {
    lines.push('**Gap Analysis:**');
    for (const [category, amounts] of Object.entries(gap)) {
      const req = amounts.required || 0;
      const cur = amounts.existing || amounts.current || 0;
      const g = amounts.gap || 0;
      if (g > 0) {
        lines.push(`- **${category}**: Need ${fmt(req)}, have ${fmt(cur)}. Gap: ${fmt(g)}`);
      } else {
        lines.push(`- **${category}**: ✓ Have ${fmt(cur)}, meets need of ${fmt(req)}`);
      }
    }
    lines.push('');
  }


  // Top 3 recommendations with why
  const recs = data.recommendations as Array<Record<string, unknown>> | undefined;
  if (recs && recs.length > 0) {
    lines.push('**Top 3 Recommendations:**');
    recs.slice(0, 3).forEach((rec: Record<string, unknown>, i: number) => {
      const name = rec.productName || rec.name || 'Unknown';
      const prov = rec.provider || '';
      const prem = rec.estimatedPremium || rec.monthlyPremium || 'N/A';
      const note = rec.reason || rec.advisorNote || '';
      lines.push(`${i + 1}. **${name}** (${prov}) - ${prem}`);
      if (note) lines.push(`   → ${String(note).slice(0, 150)}`);
    });
    lines.push('');
  }


  // Raw explanation from LLM - could be stringified JSON
  let rawText = (data.content || data.explanation || data.analysis) as string | undefined;
  if (rawText && typeof rawText === 'string') {
    // Try to detect and parse JSON object
    const trimmed = rawText.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        // If parsed successfully, extract the summary
        if (parsed.summary) {
          lines.push(`**Summary:**\n${parsed.summary.slice(0, 500)}\n`);
        }
        // Re-extract gap and recommendations from parsed JSON
        if (parsed.gapAnalysis) {
          lines.push('**Gap Analysis:**');
          for (const [cat, amounts] of Object.entries(parsed.gapAnalysis as Record<string, { required: number; existing: number; gap: number }>)) {
            const { required, existing, gap } = amounts as { required: number; existing: number; gap: number };
            if (gap > 0) lines.push(`- ${cat}: Need ${fmt(required)}, Have ${fmt(existing)}, Gap ${fmt(gap)}`);
            else lines.push(`- ${cat}: ✓ Covered (${fmt(existing)})`);
          }
          lines.push('');
        }
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          lines.push('**Top Recommendations:**');
          parsed.recommendations.slice(0, 3).forEach((r: Record<string, unknown>, i: number) => {
            lines.push(`${i + 1}. **${r.productName}** (${r.estimatedPremium})`);
            if (r.reason) lines.push(`   → ${(r.reason as string).slice(0, 150)}`);
          });
        }
      } catch {
        // Not valid JSON, show cleaned text
        lines.push(trimmed.slice(0, 1500));
      }
    } else {
      // Clean up markdown and show
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleaned.length > 0 && lines.length <= 2) {
        lines.push(cleaned.slice(0, 1500));
      }
    }
  }

  return lines.join('\n') || 'Analyzing your requirements…';
}

// --- Left Panel: Step Wizard ---

function IntakeWizard({ form, updateForm, step, setStep, confirmed, setConfirmed }: {
  form: ClientData;
  updateForm: (field: keyof ClientData, value: number | boolean | string) => void;
  step: number;
  setStep: (s: number) => void;
  confirmed: boolean;
  setConfirmed: (c: boolean) => void;
}) {
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setConfirmed(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">Step {step} of 3</span>
        <Link href="/insurance" className="text-xs text-indigo-600 hover:underline">Exit</Link>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition ${step >= s ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: About You */}
      {step === 1 && (
<div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">About You</h3>

          {/* Name */}
          <div>
            <span className="text-gray-900 block mb-1 text-xs">Name (Optional)</span>
            <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)}
              placeholder="Enter client name"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-gray-900 placeholder:text-gray-900" />
          </div>

          {/* Age */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Age</span>
              <span className="font-medium text-gray-900">{form.age}</span>
            </div>
            <input type="range" min="18" max="70" value={form.age}
              onChange={e => {
                const newAge = parseInt(e.target.value);
                const maxTerm = Math.min(50, 100 - newAge);
                updateForm('age', newAge);
                if (form.coverageTerm > maxTerm) updateForm('coverageTerm', maxTerm);
              }}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600" />
          </div>

          {/* Gender */}
          <div>
            <span className="text-xs text-gray-500 block mb-1">Gender</span>
            <div className="flex gap-1">
              <button onClick={() => updateForm('gender', 'male')}
                className={`flex-1 py-1.5 text-xs rounded border ${form.gender === 'male' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'}`}>
                👨 Male
              </button>
              <button onClick={() => updateForm('gender', 'female')}
                className={`flex-1 py-1.5 text-xs rounded border ${form.gender === 'female' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-900 border-gray-200 hover:border-pink-300'}`}>
                👩 Female
              </button>
            </div>
          </div>

          {/* Annual Income */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Annual Income</span>
              <span className="font-medium text-gray-900">{fmt(form.annualIncome)}</span>
            </div>
            <input type="range" min="24000" max="1000000" step="24000" value={form.annualIncome}
              onChange={e => updateForm('annualIncome', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-600" />
          </div>

          {/* Smoker */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Smoker?</span>
            <button onClick={() => updateForm('smoker', !form.smoker)}
              className={`w-8 h-4 rounded-full transition ${form.smoker ? 'bg-rose-500' : 'bg-gray-200'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition ${form.smoker ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Monthly Budget</span>
              <span className="font-medium text-gray-900">{fmtBudget(form.monthlyBudget)}</span>
            </div>
            <input type="range" min="100" max="5000" step="100" value={form.monthlyBudget}
              onChange={e => updateForm('monthlyBudget', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-600" />
          </div>

          {/* Coverage Term */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Coverage Term</span>
              <span className="font-medium text-gray-900">{form.coverageTerm} yrs</span>
            </div>
            <input type="range" min="5" max="50" step="5" value={form.coverageTerm}
              onChange={e => {
                const val = parseInt(e.target.value);
                const maxTerm = Math.min(50, 100 - form.age);
                updateForm('coverageTerm', Math.min(val, maxTerm));
              }}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Age + Term = {form.age + form.coverageTerm}</span>
              {form.age + form.coverageTerm > 100 && (
                <span className="text-rose-500 font-medium">Max 100</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Protection Needs */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Protection Needs</h3>
          
          {/* Sum Assured */}
          <div>
            <span className="text-xs text-gray-500 block mb-1">Intend Sum Assured</span>
            <select value={form.intendSumAssured} onChange={e => updateForm('intendSumAssured', parseInt(e.target.value))}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded text-gray-900">
              <option value={50000}>RM50,000</option>
              <option value={100000}>RM100,000</option>
              <option value={200000}>RM200,000</option>
              <option value={300000}>RM300,000</option>
              <option value={500000}>RM500,000</option>
              <option value={1000000}>RM1,000,000</option>
              <option value={2000000}>RM2,000,000</option>
              <option value={3000000}>RM3,000,000</option>
              <option value={5000000}>RM5,000,000</option>
              <option value={10000000}>RM10,000,000</option>
            </select>
          </div>

          {/* Dependents */}
          <div>
            <span className="text-xs text-gray-500 block mb-1">No. of Dependents</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => updateForm('dependents', n)}
                  className={`w-8 h-8 text-xs rounded border ${form.dependents === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Covers */}
          <div>
            <span className="text-xs text-gray-500 block mb-2">Existing Coverage</span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-gray-500 w-12">Life</span>
                <select value={form.existingLifeCover} onChange={e => updateForm('existingLifeCover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded text-gray-900">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                  <option value={500000}>RM500k</option>
                  <option value={1000000}>RM1M</option>
                  <option value={2000000}>RM2M</option>
                  <option value={3000000}>RM3M</option>
                  <option value={5000000}>RM5M</option>
                  <option value={10000000}>RM10M</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs text-gray-500 w-12">CI</span>
                <select value={form.existingCICover} onChange={e => updateForm('existingCICover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded text-gray-900">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                  <option value={500000}>RM500k</option>
                  <option value={1000000}>RM1M</option>
                  <option value={2000000}>RM2M</option>
                  <option value={3000000}>RM3M</option>
                  <option value={5000000}>RM5M</option>
                  <option value={10000000}>RM10M</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-gray-500 w-12">Medical</span>
                <select value={form.existingMedicalCover} onChange={e => updateForm('existingMedicalCover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded text-gray-900">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                  <option value={500000}>RM500k</option>
                  <option value={1000000}>RM1M</option>
                  <option value={2000000}>RM2M</option>
                  <option value={3000000}>RM3M</option>
                  <option value={5000000}>RM5M</option>
                  <option value={10000000}>RM10M</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Preferences</h3>
<div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateForm('investmentPreference', 'investment-linked')}
              className={`p-2 rounded-lg border-2 transition ${form.investmentPreference === 'investment-linked' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-lg mb-1">📈</div>
              <p className="text-xs font-medium text-gray-900">IL</p>
            </button>
            <button onClick={() => updateForm('investmentPreference', 'non-investment-linked')}
              className={`p-2 rounded-lg border-2 transition ${form.investmentPreference === 'non-investment-linked' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-lg mb-1">🔒</div>
              <p className="text-xs font-medium text-gray-900">Traditional</p>
            </button>
          </div>

          {/* Summary */}
          {confirmed && (
<div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-green-700">✓ Confirmed</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-gray-900">
                  {form.name && <div><span className="text-gray-900">Name:</span> {form.name}</div>}
                  <div><span className="text-gray-900">Age:</span> {form.age}</div>
                  <div><span className="text-gray-900">Gender:</span> {form.gender}</div>
                  <div><span className="text-gray-900">Income:</span> {fmt(form.annualIncome)}/yr</div>
                  <div><span className="text-gray-900">Budget:</span> {fmtBudget(form.monthlyBudget)}</div>
                  <div><span className="text-gray-900">Sum:</span> {fmt(form.intendSumAssured)}</div>
                  <div><span className="text-gray-900">Dependents:</span> {form.dependents}</div>
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="p-3 bg-indigo-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-indigo-700">Protection Gaps</p>
                {(() => {
                  const lifeRequired = form.age > 55 ? form.annualIncome * 5 : form.annualIncome * 8;
                  const ciRequired = Math.max(form.annualIncome * 3, 150000);
                  const medicalRequired = form.monthlyBudget >= 800 ? 1000000 : form.monthlyBudget >= 500 ? 500000 : 200000;
                  const lifeGap = Math.max(0, lifeRequired - form.existingLifeCover);
                  const ciGap = Math.max(0, ciRequired - form.existingCICover);
                  const medicalGap = Math.max(0, medicalRequired - form.existingMedicalCover);
                  return (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Life (8× income)</span>
                        <span className={lifeGap > 0 ? 'text-rose-600 font-medium' : 'text-green-600'}>
                          {lifeGap > 0 ? fmt(lifeGap) + ' gap' : '✓ OK'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">CI (3× income)</span>
                        <span className={ciGap > 0 ? 'text-rose-600 font-medium' : 'text-green-600'}>
                          {ciGap > 0 ? fmt(ciGap) + ' gap' : '✓ OK'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Medical (RM1M)</span>
                        <span className={medicalGap > 0 ? 'text-rose-600 font-medium' : 'text-green-600'}>
                          {medicalGap > 0 ? fmt(medicalGap) + ' gap' : '✓ OK'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {step > 1 ? (
          <button onClick={handleBack}
            className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-900">
            ← Back
          </button>
        ) : (
          <div className="flex-1"></div>
        )}
        <button onClick={handleNext} disabled={step === 3 && !form.investmentPreference}
          className="flex-1 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">
          {step < 3 ? 'Next →' : confirmed ? '✓ Confirmed' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

// --- Main ---

export default function InsurancePreview() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clients, setClients] = useState<AdvisorClient[]>([]);
  const [role, setRole] = useState<string | null>(null);

  // Chat state — initialize empty, restore from sessionStorage after mount
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<ClientData>({
    name: '',
    age: 30,
    gender: 'male',
    annualIncome: 60000,
    smoker: false,
    monthlyBudget: 500,
    coverageTerm: 10,
    intendSumAssured: 100000,
    dependents: 1,
    existingLifeCover: 0,
    existingCICover: 0,
    existingMedicalCover: 0,
    existingEndowmentCover: 0,
    investmentPreference: null,
  });

// Mount: find last session or create new one, then load history
  useEffect(() => {
    fetch('/api/chat/last-session')
      .then(r => r.json())
      .then(d => {
        const sid = d.sessionId || ('sess_' + Math.random().toString(36).slice(2, 12));
        if (d.sessionId) {
          sessionStorage.setItem('insurance_session_id', d.sessionId);
        } else {
          sessionStorage.setItem('insurance_session_id', sid);
        }
        setSessionId(sid);
        return sid;
      })
      .then(sid => {
        return fetch(`/api/chat/${sid}/messages?limit=20`)
          .then(r => r.json())
          .then(data => {
            if (data.messages && data.messages.length > 0) {
              const restored: Message[] = data.messages.map((m: { role: string; content: string }, i: number) => ({
                id: `restored-${sid}-${i}`,
                role: m.role as 'user' | 'assistant',
                content: m.content,
              }));
              setMessages(restored);
              setHasMoreMessages(data.messages.length >= 20);
            } else {
              setMessages([{
                id: nanoid(),
                role: 'assistant',
                type: 'welcome',
                content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
              }]);
              setHasMoreMessages(false);
            }
            setHydrated(true);
          })
          .catch(() => {
            setMessages([{
              id: nanoid(),
              role: 'assistant',
              type: 'welcome',
              content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
            }]);
            setHasMoreMessages(false);
            setHydrated(true);
          });
      })
      .catch(() => {
        const newId = 'sess_' + Math.random().toString(36).slice(2, 12);
        sessionStorage.setItem('insurance_session_id', newId);
        setSessionId(newId);
        setMessages([{
          id: nanoid(),
          role: 'assistant',
          type: 'welcome',
          content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
        }]);
        setHasMoreMessages(false);
        setHydrated(true);
      });
  }, []);

  // Fetch role and clients on mount
  useEffect(() => {
    fetch('/api/client/me')
      .then(r => r.json())
      .then(d => setRole(d.role || null))
      .catch(() => setRole(null));

    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {});
  }, []);

  // Load chat history from DB when sessionId changes (last 50 only)
  const loadChatHistory = useCallback((sid: string, prepend = false) => {
    fetch(`/api/chat/${sid}/messages?limit=20`)
      .then(r => r.json())
      .then(d => {
        if (d.messages && d.messages.length > 0) {
          const restored: Message[] = d.messages.map((m: { role: string; content: string }, i: number) => ({
            id: `restored-${sid}-${i}`,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
          setMessages(prev => prepend ? [...restored, ...prev] : restored);
          setHasMoreMessages(d.messages.length >= 20);
          setHydrated(true);
        } else {
          setMessages([{
            id: nanoid(),
            role: 'assistant',
            type: 'welcome',
            content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
          }]);
          setHasMoreMessages(false);
          setHydrated(true);
        }
      })
      .catch(() => {
        setMessages([{
          id: nanoid(),
          role: 'assistant',
          type: 'welcome',
          content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
        }]);
        setHasMoreMessages(false);
        setHydrated(true);
      });
  }, []);

  // Load financial snapshot when client selected
  useEffect(() => {
    if (!selectedClientId) return;

    fetch(`/api/clients/${selectedClientId}/financials`)
      .then(r => r.json())
      .then(d => {
        const snap = d.snapshots?.[0];
        if (!snap) return;

        const client = clients.find(c => c.id === selectedClientId);
        const fullName = client ? `${client.firstName} ${client.lastName}`.trim() : '';

        // Compute age from dateOfBirth if available
        let age = 30;
        if (client?.dateOfBirth) {
          const dob = new Date(client.dateOfBirth);
          const today = new Date();
          age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18) age = 18;
          if (age > 70) age = 70;
        }

        const genderMap: Record<string, 'male' | 'female'> = {
          'Male': 'male', 'male': 'male',
          'Female': 'female', 'female': 'female',
        };

        setForm(prev => ({
          ...prev,
          name: fullName || prev.name,
          age: age,
          gender: (client?.gender && genderMap[client.gender]) ? genderMap[client.gender] : prev.gender,
          annualIncome: snap.monthlyIncome ? snap.monthlyIncome * 12 : prev.annualIncome,
          monthlyBudget: prev.monthlyBudget,
        }));
        setStep(1);
        setConfirmed(false);
      })
      .catch(() => {});
  }, [selectedClientId, clients]);

  const updateForm = (field: keyof ClientData, value: number | boolean | string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'K';
    return (bytes / (1024 * 1024)).toFixed(1) + 'M';
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          id: nanoid(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Welcome message — only add if not yet hydrated and no messages
  useEffect(() => {
    if (hydrated) return;
    setMessages([{
      id: nanoid(),
      role: 'assistant',
      type: 'welcome',
      content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
    }]);
    setHydrated(true);
  }, [hydrated]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Persist to sessionStorage only (DB save handled in sendMessage's finally block)
  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return;
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem('insurance_messages', JSON.stringify(messages));
    } catch { /* ignore quota errors */ }
  }, [messages, hydrated]);

  const sendMessage = useCallback(async (text: string, attachedFiles?: Attachment[]) => {
    if (!text.trim() && (!attachedFiles || attachedFiles.length === 0) || loading) return;
    const files = attachedFiles || attachments;

    const history: Array<{ role: 'user' | 'assistant'; content: string }> = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content || '' }));

    const userMsg: Message = { id: nanoid(), role: 'user', content: text, attachments: files.length > 0 ? files : undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setAttachments([]);

    let assistantMsgId = '';
    let finalContent = '';

    try {
      const client = buildClientForAPI(form);
      const res = await fetch('/api/insurance/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, query: text, attachments: files, history }),
      });
      const assistantMsg: Message = { id: nanoid(), role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);
      assistantMsgId = assistantMsg.id;

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            assistantMsg.content += chunk;
            setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m));
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        assistantMsg.content = 'Failed to read response stream';
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: assistantMsg.content } : m));
      }
      finalContent = assistantMsg.content;
    } catch (err) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
      if (sessionId && text) {
        fetch(`/api/chat/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: text }),
        }).catch(() => {});
      }
      if (sessionId && finalContent) {
        fetch(`/api/chat/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: finalContent }),
        }).catch(() => {});
      }
    }
  }, [form, sessionId, attachments, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handlePrint = () => {
    const conversation = messages
      .filter(m => m.content)
      .map((m, i) => {
        const role = m.role === 'user' ? 'Client' : 'AI Strategist';
        const content = m.content || '';
        const htmlContent = content
          .replace(/\n/g, '<br/>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^#{1,6}\s+(.*)$/gm, '<h3>$1</h3>')
          .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
          .replace(/\|(.+)\|/g, (match) => {
            const cells = match.split('|').map(c => c.trim());
            const isHeader = cells.every(c => c.match(/^-+$/));
            if (isHeader) return '';
            const tag = 'td';
            return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
          });
        return `<div style="margin-bottom:20px;padding:12px;border-radius:8px;${m.role === 'user' ? 'background:#EEF2FF;' : 'background:#F9FAFB;border:1px solid #E5E7EB;'}"><strong style="color:${m.role === 'user' ? '#4F46E5' : '#059669'}">${role}:</strong><div style="margin-top:8px;line-height:1.6;">${htmlContent || '<em>Loading...</em>'}</div></div>`;
      }).join('');

    const clientInfo = `
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h2 style="margin:0 0 8px;font-size:16px;">Client Profile</h2>
        <p style="margin:4px 0;font-size:13px;"><strong>Name:</strong> ${form.name || 'Client'}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Age:</strong> ${form.age} yrs</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Gender:</strong> ${form.gender || 'N/A'}</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Income:</strong> RM ${Number(form.annualIncome || 0).toLocaleString()}/year</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Budget:</strong> RM ${Number(form.monthlyBudget || 0).toLocaleString()}/month</p>
        <p style="margin:4px 0;font-size:13px;"><strong>Dependents:</strong> ${form.dependents || 0}</p>
      </div>`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Insurance Report - ${new Date().toLocaleDateString('en-MY')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; max-width: 800px; margin: 0 auto; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .date { color: #666; font-size: 13px; margin-bottom: 24px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
    th { background: #F3F4F6; font-weight: 600; }
    tr:nth-child(even) { background: #F9FAFB; }
    h3 { font-size: 15px; margin: 16px 0 8px; color: #1F2937; }
    ul { margin: 4px 0; padding-left: 20px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>🛡️ Insurance Strategy Report</h1>
  <p class="date">Generated: ${new Date().toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  ${clientInfo}
  ${conversation}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:11px;color:#666;">
    <p>This report is generated by AI Insurance Strategist · CFP Malaysia</p>
    <p>Recommendations should be verified with a licensed financial advisor.</p>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 250);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLeft(!showLeft)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-indigo-600" />
          <h1 className="text-sm font-bold text-gray-900">AI Insurance Strategist</h1>
          <span className="text-xs text-gray-400">Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden md:block">
            {confirmed ? `${form.age} yrs • ${fmtBudget(form.monthlyBudget)}` : 'Incomplete'}
          </span>
          <Link href="/dashboard/overview" className="text-xs text-indigo-600 hover:text-indigo-800">← Dashboard</Link>
          <button onClick={handlePrint} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Print</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${showLeft ? 'block' : 'hidden lg:block'}`}>
          {role === 'advisor' && (
            <div className="mb-4">
              <label className="block text-xs text-gray-500 uppercase mb-1 font-semibold">Select Client</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">— New client —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <IntakeWizard 
            form={form} 
            updateForm={updateForm} 
            step={step} 
            setStep={setStep}
            confirmed={confirmed}
            setConfirmed={setConfirmed}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl markdown-content ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-2xl px-4 py-3 shadow-sm text-sm`}>
                  {msg.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /><span>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!loading && messages.length > 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 4).map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-xs border border-gray-200 text-gray-900 rounded-full px-3 py-1 hover:bg-indigo-50 hover:border-indigo-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-1 text-xs text-indigo-700">
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[100px] truncate">{att.name}</span>
                    <span className="text-indigo-400">{formatFileSize(att.size)}</span>
                    <button onClick={() => removeAttachment(att.id)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-900 hover:bg-gray-50"><Paperclip className="w-4 h-4" /></button>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about coverage, compare products, or attach a file…"
                rows={1} className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-900" />
              <button type="submit" disabled={(!input.trim() && attachments.length === 0) || loading}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right panel — Conversation History */}
        <div className={`w-72 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${showRight ? 'block' : 'hidden lg:block'}`}>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Conversation</h3>
          {!hydrated ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : messages.filter(m => m.role !== 'assistant' || m.content).length === 0 ? (
            <p className="text-xs text-gray-400">No messages yet.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, i) => {
                if (!msg.content && msg.role === 'assistant') return null;
                return (
                  <div key={msg.id} className="text-xs border border-gray-100 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`font-semibold text-[10px] uppercase px-1.5 py-0.5 rounded ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-gray-400 text-[10px]">#{i + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed line-clamp-4">
                      {stripMarkdown(msg.content || '').slice(0, 200)}{msg.content && msg.content.length > 200 ? '…' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}