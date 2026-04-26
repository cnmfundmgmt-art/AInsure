'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield, ChevronLeft, ChevronRight, Loader2, CheckCircle, Send,
  Heart, Stethoscope, Package, Menu, Paperclip, X
} from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

// --- Types ---

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

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  type?: string;
  attachments?: Attachment[];
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

function fixMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(c => c !== '');
      if (cells.length > 0 && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('|') && nextLine.endsWith('|') && !nextLine.includes('---')) {
          result.push(line);
          const sep = cells.map(() => '---').join('|');
          result.push(sep);
          i++;
          continue;
        }
      }
      result.push(line);
    } else {
      result.push(line);
    }
  }
  return result.join('\n');
}

function renderAssistantResponse(data: Record<string, unknown>, _query: string) {
  const rawText = (data.content as string) || '';
  return fixMarkdownTables(rawText) || 'Analyzing your requirements…';
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


