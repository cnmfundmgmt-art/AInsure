'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Camera, Loader2, XCircle, RefreshCw, PlusCircle } from 'lucide-react';

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

interface ExistingPolicy {
  policyType: string;
  sumAssured: number;
  premium: number;
}

interface SidebarContentProps {
  sessionId: string | null;
  onAnalysisComplete: (data: {
    sessionId: string;
    client: Record<string, unknown>;
    gapAnalysis: Record<string, Record<string, number>>;
    recommendedProducts: unknown[];
    pitchScript: string;
    painPoints: unknown[];
    notes: string[];
    cashValueChart: unknown;
  }) => void;
}

// --- parseDOBFromIC ------------------------------------------------------------

function parseDOBFromIC(icNumber: string): { dob: string; age: number } | null {
  if (!icNumber || icNumber.length < 6) return null;
  const yy = parseInt(icNumber.substring(0, 2));
  const mm = parseInt(icNumber.substring(2, 4));
  const dd = parseInt(icNumber.substring(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const cur = new Date().getFullYear() - 2000;
  const year = yy <= cur ? 2000 + yy : 1900 + yy;
  const dob = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - (mm - 1);
  if (m < 0 || (m === 0 && today.getDate() < dd)) age--;
  return { dob, age: Math.max(0, age) };
}

// --- ICScanUpload -------------------------------------------------------------

type OcrPhase = 'idle' | 'downloading' | 'extracting' | 'done' | 'error';

function ICScanUpload({ onExtracted }: { onExtracted: (data: { name: string; icNumber: string; dob: string; age: number; gender: string; nationality: string }) => void }) {
  const [phase, setPhase] = useState<OcrPhase>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image (JPG, PNG, WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be under 10MB'); return; }
    setError(''); setPreview(URL.createObjectURL(file)); setPhase('downloading'); setProgressMsg('Starting OCR engine...');
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '';
      const fd = new FormData();
      fd.append('file', file); fd.append('id_type', 'mykad');
      const res = await fetch(`${API}/api/verification/ocr?stream=1`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      if (!reader) throw new Error('No response stream');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('event: ')) continue;
          const evt = line.slice(7).trim();
          const di = lines.indexOf(line) + 1;
          if (di >= lines.length || !lines[di].startsWith('data: ')) continue;
          const payload = JSON.parse(lines[di].slice(6));
          if (evt === 'phase' && payload.phase === 'initialising') {
            setPhase('downloading'); setProgressMsg(payload.message || 'Setting up...');
          } else if (evt === 'done') {
            const d = payload.data as Record<string, unknown>;
            const rawIC = (d.icNumber as string) || (d.ic_number as string) || '';
            const icNumber = rawIC.replace(/\s/g, '');
            const dobAge = parseDOBFromIC(icNumber);
            setConfidence((d.confidence as number) ?? null);
            setPhase('done');
            onExtracted({
              name: (d.fullName as string) || (d.nameClean as string) || '',
              icNumber,
              dob: dobAge?.dob || '',
              age: dobAge?.age || 0,
              gender: (d.gender as string) || '',
              nationality: 'Malaysian',
            });
            toast.success('IC scanned successfully!');
            return;
          } else if (evt === 'error') {
            throw new Error(payload.error || 'Extraction failed');
          }
        }
      }
      throw new Error('OCR stream ended unexpectedly');
    } catch (err) {
      setPhase('error'); setError((err as Error).message); toast.error((err as Error).message);
    }
  }, [onExtracted]);

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) handleFile(accepted[0]); }, [handleFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragActive || dragActive ? 'border-indigo-500 bg-indigo-50' :
          preview && phase === 'done' ? 'border-green-400 bg-green-50' :
          'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50'
        } ${phase === 'downloading' || phase === 'extracting' ? 'cursor-not-allowed opacity-70' : ''}`}
        onDragEnter={() => setDragActive(true)} onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-1">
            <img src={preview} alt="IC" className="max-h-28 mx-auto rounded-lg object-contain border border-gray-200 shadow-sm" />
            {phase === 'done' && <p className="text-xs text-green-600 font-medium">a Scan complete{confidence != null ? `  ${(confidence * 100).toFixed(0)}% confidence` : ''}</p>}
            <button type="button" onClick={(e) => { e.stopPropagation(); setPhase('idle'); setError(''); setPreview(null); setConfidence(null); }}
              className="text-xs text-gray-500 hover:text-red-500 transition">Remove & re-upload</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1">
            <Camera className="w-5 h-5 text-indigo-500" />
            <p className="text-xs font-medium text-gray-600">{isDragActive ? 'Drop IC here' : 'Click or drag MyKad'}</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP a" max 10MB</p>
          </div>
        )}
      </div>
      {phase === 'downloading' && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-indigo-700 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
          <span>{progressMsg || 'Downloading OCR modelsa...'}</span>
        </div>
      )}
      {phase === 'error' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Extraction failed</p>
            <p className="text-red-400">{error}</p>
            <button onClick={() => { setPhase('idle'); setError(''); }}
              className="mt-1 flex items-center gap-1 text-amber-700 border border-amber-300 rounded px-2 py-0.5 hover:bg-amber-50 transition bg-amber-50">
              <RefreshCw className="w-3 h-3" /> Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SidebarContent ------------------------------------------------------------

export function SidebarContent({ sessionId, onAnalysisComplete }: SidebarContentProps) {
  // Client intake form state
  const [clientName, setClientName] = useState('');
  const [clientIC, setClientIC] = useState('');
  const [clientDOB, setClientDOB] = useState('');
  const [clientAge, setClientAge] = useState(0);
  const [clientGender, setClientGender] = useState('');
  const [clientIncome, setClientIncome] = useState<number | undefined>(undefined);
  const [clientBudget, setClientBudget] = useState(500);
  const [clientDependents, setClientDependents] = useState(2);
  const [clientGoals, setClientGoals] = useState('Education, Family Protection');
  const [existingPolicies, setExistingPolicies] = useState<ExistingPolicy[]>([]);

  // UI toggles
  const [intakeOpen, setIntakeOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleICExtracted = useCallback((data: { name: string; icNumber: string; dob: string; age: number; gender: string }) => {
    setClientName(data.name);
    setClientIC(data.icNumber);
    setClientDOB(data.dob);
    setClientAge(data.age);
    setClientGender(data.gender);
    if (data.age > 0) toast.success(`IC scanned! Age: ${data.age} years old`);
    else toast.success('IC scanned! Please verify or enter age manually');
  }, []);

  const handleAddPolicy = () => {
    setExistingPolicies(prev => [...prev, { policyType: '', sumAssured: 0, premium: 0 }]);
  };

  const handlePolicyChange = (index: number, field: keyof ExistingPolicy, value: string | number) => {
    setExistingPolicies(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePolicy = (index: number) => {
    setExistingPolicies(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = useCallback(async () => {
    if (!clientIncome || clientIncome <= 0) {
      toast.error('Please enter annual income before starting analysis');
      return;
    }
    setAnalysisLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API}/api/insurance/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData: {
            name: clientName,
            icNumber: clientIC,
            dob: clientDOB,
            age: clientAge,
            gender: clientGender,
            nationality: 'Malaysian',
            income: clientIncome,
            monthlyBudget: clientBudget || 500,
            dependents: clientDependents,
            goals: clientGoals || (clientDependents > 0 ? 'Education, Family Protection' : 'Family Protection'),
            existingPolicies: existingPolicies.length > 0
              ? existingPolicies.map(p => ({ policyType: p.policyType, sumAssured: p.sumAssured || 0, premium: p.premium || 0 }))
              : [],
          },
          sessionId: sessionId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      onAnalysisComplete(data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [clientName, clientIC, clientDOB, clientAge, clientGender, clientIncome, clientBudget, clientDependents, clientGoals, existingPolicies, sessionId, onAnalysisComplete]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Client Intake</h2>
        <button
          onClick={() => setIntakeOpen(!intakeOpen)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {intakeOpen ? 'a-2' : 'a-1/4'}
        </button>
      </div>

      {intakeOpen && (
        <>
          {/* IC Scan */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Scan MyKad</label>
            <ICScanUpload onExtracted={handleICExtracted} />
          </div>

          {/* Client Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Client Name</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Ahmad bin Ali"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* IC Number & DOB */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">IC Number</label>
              <input
                type="text"
                value={clientIC}
                onChange={e => setClientIC(e.target.value)}
                placeholder="e.g. 901203-14-1234"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Date of Birth</label>
              <input
                type="date"
                value={clientDOB}
                onChange={e => setClientDOB(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900"
              />
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Age</label>
              <input
                type="number"
                value={clientAge || ''}
                onChange={e => setClientAge(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Gender</label>
              <select
                value={clientGender}
                onChange={e => setClientGender(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white text-gray-900"
              >
                <option value="" className="text-gray-400">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Annual Income */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Annual Income (RM)</label>
            <input
              type="number"
              value={clientIncome || ''}
              onChange={e => setClientIncome(parseInt(e.target.value) || undefined)}
              placeholder="e.g. 60000"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Monthly Budget (RM)</label>
            <input
              type="number"
              value={clientBudget}
              onChange={e => setClientBudget(parseInt(e.target.value) || 500)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Dependents */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Dependents</label>
            <input
              type="number"
              value={clientDependents}
              onChange={e => setClientDependents(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-gray-900"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Goals</label>
            <input
              type="text"
              value={clientGoals}
              onChange={e => setClientGoals(e.target.value)}
              placeholder="e.g. Education, Family Protection"
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Existing Policies */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Existing Policies</label>
              <button
                onClick={handleAddPolicy}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add
              </button>
            </div>
            {existingPolicies.map((policy, index) => (
              <div key={index} className="flex items-center gap-1 mb-1">
                <input
                  type="text"
                  value={policy.policyType}
                  onChange={e => handlePolicyChange(index, 'policyType', e.target.value)}
                  placeholder="Type"
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  value={policy.sumAssured || ''}
                  onChange={e => handlePolicyChange(index, 'sumAssured', parseInt(e.target.value) || 0)}
                  placeholder="SA"
                  className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <input
                  type="number"
                  value={policy.premium || ''}
                  onChange={e => handlePolicyChange(index, 'premium', parseInt(e.target.value) || 0)}
                  placeholder="Premium"
                  className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <button
                  onClick={() => handleRemovePolicy(index)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  a   
                </button>
              </div>
            ))}
            {existingPolicies.length === 0 && (
              <p className="text-xs text-gray-400 italic">No existing policies</p>
            )}
          </div>

          {/* Start Analysis Button */}
          <button
            onClick={handleStartAnalysis}
            disabled={analysisLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {analysisLoading ? 'Analyzinga...' : 'Start Analysis'}
          </button>
        </>
      )}

      {/* Session History */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Session History</h2>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {historyOpen ? 'a-2' : 'a-1/4'}
          </button>
        </div>
        {historyOpen && (
          <p className="text-xs text-gray-400 mt-1 italic">Loading sessionsa...</p>
        )}
      </div>
    </div>
  );
}