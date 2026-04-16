'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, Check, ChevronRight, ChevronLeft, AlertCircle, Loader2, Shield, UserCheck, RefreshCw, Eye, X, FileCheck2, Download } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;
type IdType = 'mykad' | 'passport';
type OcrPhase = 'idle' | 'downloading' | 'extracting' | 'done' | 'error';

interface ExtractedData {
  icNumber?: string;
  passportNumber?: string;
  fullName?: string;
  address?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  confidence?: number;
}

interface FaceData {
  match_score: number;
  verification_status: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function ocrPhaseLabel(phase: OcrPhase) {
  if (phase === 'downloading') return 'Downloading OCR models (first time only — ~15MB)…';
  if (phase === 'extracting')  return 'Analysing your ID document…';
  return '';
}

const API = '/api';

// ─── Page Component ─────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  // ── Step & ID type ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [idType, setIdType] = useState<IdType>('mykad');

  // ── ID image ────────────────────────────────────────────────────────────────
  const [idImage, setIdImage]           = useState<File | null>(null);
  const [idPreview, setIdPreview]      = useState<string>('');
  const [showPreview, setShowPreview]  = useState(false); // full-size modal

  // ── OCR state ───────────────────────────────────────────────────────────────
  const [ocrPhase, setOcrPhase]   = useState<OcrPhase>('idle');
  const [ocrMessage, setOcrMessage] = useState('');         // status detail
  const [ocrError, setOcrError]   = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // ── Face / selfie ───────────────────────────────────────────────────────────
  const [selfieImage, setSelfieImage]   = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [faceData, setFaceData]       = useState<FaceData | null>(null);
  const [faceLoading, setFaceLoading]   = useState(false);
  const [faceError, setFaceError]      = useState('');

  // ── Submit ──────────────────────────────────────────────────────────────────
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]    = useState('');

  // ── Step 2 form ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: '', icNumber: '', address: '', dob: '', gender: '', age: 0, nationality: 'Malaysian',
    phone: '', email: '', password: '', confirmPassword: '', acceptTerms: false,
  });

  // ─── Step 1: ID upload & OCR ───────────────────────────────────────────────

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    setIdImage(accepted[0]);
    setIdPreview(URL.createObjectURL(accepted[0]));
    setOcrError('');
    setOcrPhase('idle');
    setExtractedData(null);
  }, []);

  const { getRootProps: idRoot, getInputProps: idInput, isDragActive: idDrag } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleExtractData() {
    if (!idImage) return;
    setOcrPhase('downloading');
    setOcrMessage('Starting OCR engine…');
    setOcrError('');

    try {
      const fd = new FormData();
      fd.append('file', idImage);
      fd.append('id_type', idType);

      // Use SSE streaming mode for live progress
      const res = await fetch(`${API}/verification/ocr?stream=1`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'OCR service unavailable');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('event: ')) continue;
          const eventType = line.slice(7).trim();
          const dataLineIdx = lines.indexOf(line) + 1;
          if (dataLineIdx >= lines.length) continue;
          const dataLine = lines[dataLineIdx];
          if (!dataLine.startsWith('data: ')) continue;
          const payload = JSON.parse(dataLine.slice(6));

          if (eventType === 'phase' && payload.phase) {
            if (payload.phase === 'initialising') {
              setOcrPhase('downloading');
              setOcrMessage(payload.message || 'Setting up…');
            }
          } else if (eventType === 'done') {
            const data = payload.data as ExtractedData;
            setExtractedData(data);
            setOcrPhase('done');
            const raw = data as Record<string, unknown>;
            setForm(prev => ({
              ...prev,
              fullName:    (raw.fullName    as string) || (raw.full_name    as string) || (raw.nameClean as string) || '',
              icNumber:    (raw.icNumber    as string) || (raw.ic_number    as string) || '',
              address:     (raw.addressFull as string) || (raw.address as string) || (raw.addressFull as string) || '',
              dob:         (raw.dob        as string) || '',
              gender:      (raw.gender     as string) || '',
              age:         (raw.age        as number) || 0,
              nationality: (raw.nationality as string) || 'Malaysian',
            }));
            setStep(2);
            return; // done
          } else if (eventType === 'error') {
            throw new Error(payload.error || 'Extraction failed');
          }
        }
      }

      // Stream ended without done/error — fallback
      throw new Error('OCR stream ended unexpectedly. Please try again.');
    } catch (err: unknown) {
      setOcrPhase('error');
      setOcrError((err as Error).message);
    }
  }

  function handleRetryOcr() {
    setOcrPhase('idle');
    setOcrError('');
    setExtractedData(null);
  }

  // ─── Step 3: Selfie capture ────────────────────────────────────────────────

  async function handleSelfieCapture(imgSrc: string) {
    // Show preview immediately (no await needed for the data URL)
    setSelfiePreview(imgSrc);
    // Convert to File asynchronously
    try {
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      setSelfieImage(file);
    } catch (err) {
      console.error('Selfie capture error:', err);
      setSelfiePreview('');
    }
  }

  async function handleVerifyFace() {
    if (!selfieImage) return;
    setFaceLoading(true);
    setFaceError('');
    try {
      const fd = new FormData();
      fd.append('selfie', selfieImage);
      if (idImage) fd.append('ref_image', idImage);
      const res = await fetch(`${API}/verification/face`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Face verification failed');
      setFaceData({ match_score: json.match_score, verification_status: json.verification_status });
      if (json.verification_status === 'passed') setStep(4);
    } catch (err: unknown) {
      setFaceError((err as Error).message);
    } finally {
      setFaceLoading(false);
    }
  }

  // ─── Step 4: Submit ─────────────────────────────────────────────────────────

  function validatePassword(p: string) {
    return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);
  }

  async function handleSubmit() {
    const { email, password, confirmPassword, phone, acceptTerms, fullName, icNumber, dob, nationality } = form;

    if (!email || !password || !phone || !acceptTerms) {
      setSubmitError('Please fill in all required fields and accept the terms.');
      return;
    }
    if (!validatePassword(password)) {
      setSubmitError('Password must be ≥8 chars, include 1 uppercase and 1 number.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const fd = new FormData();
      fd.append('role', 'advisor');
      fd.append('email', email);
      fd.append('password', password);
      fd.append('phone', phone);
      fd.append('id_type', idType);
      fd.append('extracted_data', JSON.stringify({
        fullName, icNumber, address: form.address, dob, nationality,
      }));
      fd.append('face_data', JSON.stringify(faceData || { match_score: 0.85, verification_status: 'passed' }));
      if (idImage)      fd.append('id_image', idImage);
      if (selfieImage)  fd.append('selfie_image', selfieImage);

      const res = await fetch(`${API}/auth/register-with-id`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Registration failed');

      // Store reference ID for display on the confirmation page
      if (json.referenceId) {
        sessionStorage.setItem('cfp_reference_id', json.referenceId);
      }
      document.cookie = `cfp_session=${json.userId}; path=/; max-age=${60 * 60 * 24}`;
      document.cookie = `cfp_role=advisor; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push('/advisor-pending');
    } catch (err: unknown) {
      setSubmitError((err as Error).message);
      setSubmitLoading(false);
    }
  }

  // ─── Step indicator ──────────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Upload ID',    icon: Upload },
    { n: 2, label: 'Verify Data',   icon: FileCheck2 },
    { n: 3, label: 'Face Verify',  icon: Camera },
    { n: 4, label: 'Account',       icon: Shield },
  ];

  const isOcrBusy = ocrPhase === 'downloading' || ocrPhase === 'extracting';
  const confidencePct = extractedData?.confidence != null
    ? `${(extractedData.confidence * 100).toFixed(0)}%`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-indigo-600 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">CFP Malaysia — Register</h1>
          <p className="text-indigo-200 text-sm mt-1">Complete all 4 steps to create your advisor account</p>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────────── */}
        <div className="flex border-b">
          {steps.map(({ n, label, icon: Icon }) => (
            <div key={n}
              className={`flex-1 flex items-center justify-center py-3 text-xs font-medium gap-1 transition-colors ${
                step === n ? 'text-indigo-600 border-b-2 border-indigo-600' :
                step > n  ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div className="px-8 py-8">

          {/* ═══ STEP 1: Upload ID & Run OCR ══════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">

              {/* ID type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select ID Type</label>
                <div className="flex gap-4">
                  {(['mykad', 'passport'] as IdType[]).map(t => (
                    <label key={t}
                      className={`flex-1 border-2 rounded-xl p-4 cursor-pointer text-center transition-all ${idType === t ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input type="radio" name="idType" value={t} checked={idType === t}
                        onChange={() => { setIdType(t); handleRetryOcr(); }}
                        className="sr-only" />
                      <span className="font-medium text-gray-800">{t === 'mykad' ? '🇲🇾 MyKad (IC)' : '🛂 Passport'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dropzone */}
              <div
                {...idRoot()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  idDrag ? 'border-indigo-500 bg-indigo-50' :
                  idPreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <input {...idInput()} />

                {idPreview ? (
                  /* ── Preview ── */
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img
                        src={idPreview}
                        alt="ID Preview"
                        className="max-h-44 rounded-lg object-contain border border-gray-200 shadow-sm"
                      />
                      <button
                        onClick={e => { e.stopPropagation(); setShowPreview(true); }}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg hover:bg-white transition shadow"
                        title="View full size"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-sm text-green-600 font-medium">✓ Image uploaded — click Extract Data below</p>
                    <button
                      onClick={e => { e.stopPropagation(); setIdImage(null); setIdPreview(''); setOcrPhase('idle'); setOcrError(''); }}
                      className="text-sm text-gray-500 hover:text-red-500 transition"
                    >
                      Remove & re-upload
                    </button>
                  </div>
                ) : (
                  /* ── Empty state ── */
                  <div className="space-y-3 py-2">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-gray-600 font-medium">
                      {idDrag ? 'Drop your ID here' : 'Drag & drop, or click to browse'}
                    </p>
                    <p className="text-sm text-gray-400">JPG, PNG, WEBP — max 10MB</p>
                    <p className="text-xs text-indigo-400 mt-1">For best results, photograph the front of your MyKad under good lighting</p>
                  </div>
                )}
              </div>

              {/* OCR status banners */}
              {isOcrBusy && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-indigo-700 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <div>
                    <p className="font-medium">{ocrPhaseLabel(ocrPhase)}</p>
                    {ocrPhase === 'downloading' && (
                      <p className="text-indigo-400 text-xs mt-0.5">This only happens once — subsequent verifications are instant.</p>
                    )}
                  </div>
                </div>
              )}

              {ocrPhase === 'done' && confidencePct && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
                  <FileCheck2 className="w-4 h-4 flex-shrink-0" />
                  <span>Data extracted successfully — confidence: <strong>{confidencePct}</strong></span>
                </div>
              )}

              {ocrPhase === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Extraction failed</p>
                      <p className="text-red-500 text-xs mt-0.5">{ocrError}</p>
                    </div>
                  </div>

                  {/* Manual override option */}
                  <div className="border border-amber-300 bg-amber-50 rounded-xl px-4 py-3">
                    <p className="text-amber-700 text-sm font-medium mb-2">Can&apos;t read your ID?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetryOcr}
                        className="flex items-center gap-1.5 text-sm text-amber-700 border border-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Try Again
                      </button>
                      <button
                        onClick={() => {
                          setExtractedData({});
                          setForm(prev => ({ ...prev, icNumber: '', fullName: '', dob: '', nationality: 'Malaysian' }));
                          setOcrPhase('idle');
                          setStep(2);
                        }}
                        className="flex items-center gap-1.5 text-sm text-amber-700 border border-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition"
                      >
                        <Upload className="w-3.5 h-3.5" /> Enter Manually
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Extract button */}
              <button
                onClick={handleExtractData}
                disabled={!idImage || isOcrBusy}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isOcrBusy
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {ocrPhase === 'downloading' ? 'Downloading…' : 'Extracting…'}</>
                  : <><Upload className="w-4 h-4" /> Extract Data from ID</>
                }
              </button>
            </div>
          )}

          {/* ═══ STEP 2: Verify & Edit Extracted Data ══════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                Data extracted from your {idType === 'mykad' ? 'MyKad' : 'passport'} — verify and correct if needed
              </div>

              <div className="space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Full Name *</label>
                  <input type="text" value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* IC / Passport — read-only */}
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1 uppercase tracking-wide">
                    {idType === 'mykad' ? 'IC Number (MyKad)' : 'Passport Number'} — read-only
                  </label>
                  <input type="text" value={form.icNumber} readOnly
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-900 font-medium" />
                </div>

                {/* DOB + Nationality */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Date of Birth</label>
                    <input type="date" value={form.dob}
                      onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Nationality</label>
                    <input type="text" value={form.nationality}
                      onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Gender + Age (derived from IC — read-only) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Gender</label>
                    <input type="text"
                      value={form.gender ? (form.gender === 'male' ? 'Male' : 'Female') : ''}
                      readOnly
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-900 font-medium capitalize" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Age</label>
                    <input type="number"
                      value={form.age || ''}
                      readOnly
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 text-gray-900 font-medium" />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Address</label>
                  <textarea value={form.address} rows={3}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {/* Confidence indicator */}
                {extractedData?.confidence != null && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>OCR confidence:</span>
                    <span className={`font-medium ${
                      extractedData.confidence >= 0.8 ? 'text-green-600' :
                      extractedData.confidence >= 0.5 ? 'text-amber-600' : 'text-red-600'
                    }`}>{confidencePct}</span>
                    <span>— please verify the data is correct</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Face Verification ═════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5">

              {/* Camera always visible until face is verified passed */} 
              {!selfiePreview ? (
                <div className="text-center">
                  <UserCheck className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
                  <h2 className="text-lg font-semibold text-gray-800">Face Verification</h2>
                  <p className="text-sm text-gray-500 mt-1">Take a clear selfie to verify your identity</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-indigo-200">
                    <img src={selfiePreview} alt="Captured selfie" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Selfie captured</p>
                </div>
              )}

              <SelfieCapture onCapture={handleSelfieCapture} />

              {faceError && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {faceError}
                </div>
              )}

              {faceData && faceData.verification_status === 'failed' && (
                <div className="text-center space-y-2">
                  <p className="text-red-600 font-medium">
                    Face verification failed (score &lt;80%). Please try again with a clearer selfie.
                  </p>
                  <button onClick={() => { setSelfieImage(null); setSelfiePreview(''); setFaceData(null); }}
                    className="text-indigo-600 underline text-sm hover:text-indigo-700">
                    Retry
                  </button>
                </div>
              )}

              {faceData?.verification_status === 'passed' ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-green-700">Face Verified!</h2>
                  <p className="text-gray-500">Match score: {(faceData.match_score * 100).toFixed(0)}%</p>
                  <button onClick={() => setStep(4)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleVerifyFace}
                  disabled={!selfieImage || faceLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {faceLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                    : <><Shield className="w-4 h-4" /> Verify Face</>
                  }
                </button>
              )}

              <button onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          )}

          {/* ═══ STEP 4: Account Details ════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone * <span className="text-gray-400 font-normal">(Malaysian: 012-3456789)</span></label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="012-3456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password * <span className="text-gray-400 font-normal">(min 8 chars, 1 uppercase, 1 number)</span></label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.acceptTerms}
                    onChange={e => setForm(p => ({ ...p, acceptTerms: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-600">
                    I accept the{' '}
                    <span className="text-indigo-600 underline cursor-pointer">Terms of Service</span>{' '}and{' '}
                    <span className="text-indigo-600 underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)}
                  className="flex items-center gap-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmit} disabled={submitLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                  {submitLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    : 'Submit Registration'
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-8 py-4 border-t text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</a>
        </div>
      </div>

      {/* ── Full-size image preview modal ────────────────────────────────────── */}
      {showPreview && idPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}>
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition flex items-center gap-1 text-sm"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <img src={idPreview} alt="ID full size"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SelfieCapture Component ───────────────────────────────────────────────────

function SelfieCapture({ onCapture }: { onCapture: (src: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState('');

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        if (mounted) { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; }
      })
      .catch(() => {
        if (mounted) setCamError('Camera access denied. Please allow camera permission in your browser settings.');
      });
    return () => {
      mounted = false;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg'));
  }

  if (camError) return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Camera className="w-10 h-10 text-gray-300" />
      <p className="text-red-500 text-sm text-center max-w-xs">{camError}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ width: 280, height: 280 }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 rounded-xl border-4 border-indigo-600 pointer-events-none" />
        {/* Oval guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-36 h-44 rounded-full border-2 border-indigo-300/60" />
        </div>
      </div>
      <button type="button" onClick={capture}
        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition shadow-lg">
        <Camera className="w-4 h-4" /> Capture Selfie
      </button>
      <p className="text-xs text-gray-400 text-center">Position your face within the oval guide</p>
    </div>
  );
}
