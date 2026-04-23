'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield, ChevronLeft, ChevronRight, Loader2, CheckCircle, Send,
  User, DollarSign, Users, Heart, Stethoscope, Target, Briefcase, Gift,
  Menu, X, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

// --- Types ---

interface ClientData {
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
};

// --- Helpers ---

function fmt(n: number) {
  return 'RM' + n.toLocaleString('en-MY');
}

function fmtBudget(n: number) {
  return 'RM' + n.toLocaleString('en-MY') + '/mo';
}

const SUGGESTIONS = [
  'Show gap analysis',
  'Compare Great Eastern vs AIA',
  'Generate pitch script',
  'What if budget is RM300?',
  'Surrender value schedule',
  'Objection handlers for budget',
];

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
          
          {/* Age */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Age</span>
              <span className="font-medium text-indigo-600">{form.age}</span>
            </div>
            <input type="range" min="18" max="70" value={form.age}
              onChange={e => updateForm('age', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600" />
          </div>

          {/* Gender */}
          <div>
            <span className="text-xs text-gray-600 block mb-1">Gender</span>
            <div className="flex gap-1">
              <button onClick={() => updateForm('gender', 'male')}
                className={`flex-1 py-1.5 text-xs rounded border ${form.gender === 'male' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                👨 Male
              </button>
              <button onClick={() => updateForm('gender', 'female')}
                className={`flex-1 py-1.5 text-xs rounded border ${form.gender === 'female' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'}`}>
                👩 Female
              </button>
            </div>
          </div>

          {/* Annual Income */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Annual Income</span>
              <span className="font-medium text-green-600">{fmt(form.annualIncome)}</span>
            </div>
            <input type="range" min="24000" max="300000" step="6000" value={form.annualIncome}
              onChange={e => updateForm('annualIncome', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-600" />
          </div>

          {/* Smoker */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Smoker?</span>
            <button onClick={() => updateForm('smoker', !form.smoker)}
              className={`w-8 h-4 rounded-full transition ${form.smoker ? 'bg-rose-500' : 'bg-gray-200'}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition ${form.smoker ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Monthly Budget</span>
              <span className="font-medium text-green-600">{fmtBudget(form.monthlyBudget)}</span>
            </div>
            <input type="range" min="100" max="3000" step="50" value={form.monthlyBudget}
              onChange={e => updateForm('monthlyBudget', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-green-600" />
          </div>

          {/* Coverage Term */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Coverage Term</span>
              <span className="font-medium text-indigo-600">{form.coverageTerm} yrs</span>
            </div>
            <input type="range" min="5" max="30" step="5" value={form.coverageTerm}
              onChange={e => updateForm('coverageTerm', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer accent-indigo-600" />
          </div>
        </div>
      )}

      {/* Step 2: Protection Needs */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Protection Needs</h3>
          
          {/* Sum Assured */}
          <div>
            <span className="text-xs text-gray-600 block mb-1">Intend Sum Assured</span>
            <select value={form.intendSumAssured} onChange={e => updateForm('intendSumAssured', parseInt(e.target.value))}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded">
              <option value={50000}>RM50,000</option>
              <option value={100000}>RM100,000</option>
              <option value={200000}>RM200,000</option>
              <option value={300000}>RM300,000</option>
              <option value={500000}>RM500,000</option>
              <option value={1000000}>RM1,000,000</option>
            </select>
          </div>

          {/* Dependents */}
          <div>
            <span className="text-xs text-gray-600 block mb-1">No. of Dependents</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => updateForm('dependents', n)}
                  className={`w-8 h-8 text-xs rounded border ${form.dependents === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Covers */}
          <div>
            <span className="text-xs text-gray-600 block mb-2">Existing Coverage</span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-gray-500 w-12">Life</span>
                <select value={form.existingLifeCover} onChange={e => updateForm('existingLifeCover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                  <option value={500000}>RM500k</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs text-gray-500 w-12">CI</span>
                <select value={form.existingCICover} onChange={e => updateForm('existingCICover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-gray-500 w-12">Medical</span>
                <select value={form.existingMedicalCover} onChange={e => updateForm('existingMedicalCover', parseInt(e.target.value))}
                  className="flex-1 px-1 py-1 text-xs border border-gray-200 rounded">
                  <option value={0}>None</option>
                  <option value={50000}>RM50k</option>
                  <option value={100000}>RM100k</option>
                  <option value={200000}>RM200k</option>
                  <option value={1000000}>RM1M</option>
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
          
          <p className="text-xs text-gray-600">Investment-linked or traditional?</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateForm('investmentPreference', 'investment-linked')}
              className={`p-2 rounded-lg border-2 transition ${form.investmentPreference === 'investment-linked' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-lg mb-1">📈</div>
              <p className="text-xs font-medium">IL</p>
            </button>
            <button onClick={() => updateForm('investmentPreference', 'non-investment-linked')}
              className={`p-2 rounded-lg border-2 transition ${form.investmentPreference === 'non-investment-linked' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="text-lg mb-1">🔒</div>
              <p className="text-xs font-medium">Traditional</p>
            </button>
          </div>

          {/* Summary */}
          {confirmed && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <p className="text-xs font-semibold text-gray-700">Confirmed</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                <div><span className="text-gray-500">Age:</span> {form.age}</div>
                <div><span className="text-gray-500">Gender:</span> {form.gender}</div>
                <div><span className="text-gray-500">Income:</span> {fmt(form.annualIncome)}/yr</div>
                <div><span className="text-gray-500">Budget:</span> {fmtBudget(form.monthlyBudget)}</div>
                <div><span className="text-gray-500">Sum:</span> {fmt(form.intendSumAssured)}</div>
                <div><span className="text-gray-500">Dependents:</span> {form.dependents}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {step > 1 ? (
          <button onClick={handleBack}
            className="flex-1 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
            ← Back
          </button>
        ) : (
          <Link href="/insurance" className="flex-1 py-2 text-xs text-center border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
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
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [form, setForm] = useState<ClientData>({
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

  const updateForm = (field: keyof ClientData, value: number | boolean | string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        id: nanoid(), 
        role: 'assistant', 
        type: 'welcome',
        content: `👋 Hi! I'm your AI Insurance Strategist.\n\nComplete the intake form on the left, then ask me about coverage recommendations, product comparisons, or pitch scripts.`,
      }]);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: nanoid(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Simulated response - in real app, call API
      await new Promise(r => setTimeout(r, 1000));
      
      const assistantMsg: Message = {
        id: nanoid(),
        role: 'assistant',
        content: `Based on:\n• Age: ${form.age}, Income: ${fmt(form.annualIncome)}/yr\n• Budget: ${fmtBudget(form.monthlyBudget)}, Dependents: ${form.dependents}\n• Existing Life: ${form.existingLifeCover ? fmt(form.existingLifeCover) : 'None'}\n\nWhat would you like to know?`,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  }, [form, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`w-72 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${showLeft ? 'block' : 'hidden lg:block'}`}>
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
                <div className={`max-w-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'} rounded-2xl px-4 py-3 shadow-sm text-sm`}>
                  {msg.role === 'assistant' && msg.content ? (
                    <div className="markdown-content overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-line">{msg.content}</span>
                  )}
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
                    className="text-xs border border-gray-200 text-gray-600 rounded-full px-3 py-1 hover:bg-indigo-50 hover:border-indigo-200">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask about coverage, compare products…"
                rows={1} className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400" />
              <button type="submit" disabled={!input.trim() || loading}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right panel (optional) */}
        <div className={`w-72 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto p-4 ${showRight ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
            <Package className="w-8 h-8 text-gray-300" />
            <p className="text-xs text-gray-400">Product browser coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}