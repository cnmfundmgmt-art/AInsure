/**
 * ID Extraction Service — position-based parsing for Malaysian IC (MyKad)
 * + Passport MRZ parsing
 */
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedIC {
  icNumber: string;
  fullName: string;
  nameClean: string;
  dob: string;
  age: number;
  gender: 'male' | 'female';
  nationality: string;
  addressLines: string[];
  addressFull: string;
  postcode: string;
  city: string;
  state: string;
  confidence: number;
  confidenceBreakdown: Record<string, number>;
}

export interface ParsedPassport {
  passportNumber: string;
  fullName: string;
  surname: string;
  givenNames: string;
  nationality: string;
  dob: string;
  expiryDate: string;
  gender: string;
  confidence: number;
}

export interface ExtractionResult {
  success: boolean;
  data?: ParsedIC | ParsedPassport;
  error?: string;
  rawLines?: string[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MALAYSIA_STATES = [
  'JOHOR', 'KEDAH', 'KELANTAN', 'MALACCA', 'NEGERI SEMBILAN',
  'PAHANG', 'PERAK', 'PERLIS', 'PENANG', 'SABAH', 'SARAWAK',
  'SELANGOR', 'TERENGGANU', 'KUALA LUMPUR', 'PUTRAJAYA', 'LABUAN',
];

// Address indicator keywords — lines containing these are almost certainly NOT names
const ADDRESS_KEYWORDS = [
  'JALAN', 'JLN', 'KAMPUNG', 'KG', 'TOKO', 'LORONG', 'DESA', 'TAMAN',
  'RAYA', 'APARTMENT', 'FLAT', 'SQUARE', 'PERSIARAN', 'MEDAN', 'BANDAR',
  'KAWASAN', 'BLOK', 'BLOCK', 'NO.', 'LOT', 'PT', 'HS', 'SENTRAL',
];

// Words that appear on Malaysian IC cards but are NOT part of a person's name
// (IC labels / classification words printed on the card)
const IC_NOISE_WORDS = new Set([
  'IC',                            // IC label on card
  'DUMMY',                         // test/fake IC names
  'WARGANEGARA', 'WARGANERARA',    // citizen
  'LELAKI',                        // male
  'PEREMPUAN',                     // female
  'KETERANGAN',                    // description / remarks
  'MALAYSIA',                      // country name
  'KAD', 'MYKAD', 'KADPENGENALAN', // card labels
  'TAHUN', 'LAHIR',                // year / birth
  'JANTINA',                       // gender
]);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function cleanup(files: string[]) {
  for (const f of files) try { fs.unlinkSync(f); } catch {}
}

function execTesseract(cmd: string, args: string[], tmpDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tesseractBin = 'C:\\Program Files\\Tesseract-OCR';
    const tesseractData = 'C:\\Program Files\\Tesseract-OCR\\tessdata';
    const child = spawn(cmd, [...args], {
      cwd: tmpDir,
      env: { ...process.env, PATH: tesseractBin + ';' + process.env.PATH, TESSDATA_PREFIX: tesseractData },
      shell: false,
    });
    let stderr = '';
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    child.on('error', (err: Error) => reject(new Error('Failed to run tesseract: ' + err.message)));
    child.on('close', (code: number) => {
      if (code === 0) {
        const outputPath = args[1];
        const format = args[args.length - 1];
        const ext = format === 'hocr' ? '.hocr' : format === 'tsv' ? '.tsv' : '.txt';
        try {
          resolve(fs.readFileSync(outputPath + ext, 'utf8').trim());
        } catch {
          try {
            const files = fs.readdirSync(tmpDir).filter((f: string) => f.startsWith(path.basename(outputPath)));
            resolve(files.length > 0 ? fs.readFileSync(path.join(tmpDir, files[0]), 'utf8').trim() : '');
          } catch { resolve(''); }
        }
      } else {
        const msg = stderr.replace(/^Tesseract.*\n?/gi, '').replace(/^Leptonica.*\n?/gi, '').trim();
        reject(new Error(msg || 'tesseract exited with code ' + code));
      }
    });
  });
}

/** Collapse excessive whitespace, strip non-printable / symbol chars */
function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').replace(/[^A-Za-z0-9\s'\-.,]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Does the line contain a Malaysian address keyword? */
function hasAddressKeyword(line: string): boolean {
  const upper = line.toUpperCase();
  // Require keyword to be at least 3 chars to avoid "IC" matching inside "KADPENGENALAN"
  return ADDRESS_KEYWORDS.some(k => k.length >= 3 && upper.includes(k))
    // Also flag lines that are mostly numbers or start with house/no
    || /^[NO\.\/\d]/.test(line)
    // Lines that look like "123, JALAN..."
    || /^\d+[,]?\s*[A-Z]/.test(line);
}

/** Is this a garbage / noise line? */
function isNoise(line: string): boolean {
  if (!line || line.length < 2) return true;
  const words = line.split(/\s+/).filter((w: string) => w.replace(/[.\-,']/g, '').length > 1);
  return words.length === 0;
}

/** Check if any individual word in the line is an IC noise word */
function hasIcNoiseWord(line: string): boolean {
  const words = line.toUpperCase().split(/\s+/);
  return words.some(w => IC_NOISE_WORDS.has(w));
}

/** Remove individual IC noise words from a line (used to clean address lines) */
function stripIcNoiseWords(line: string): string {
  const words = line.split(/\s+/);
  const cleaned = words
    .filter(w => !IC_NOISE_WORDS.has(w.toUpperCase()))
    .join(' ');
  return cleaned;
}

/** Check if line looks like a person name (letters/spaces/dots/hyphens/apostrophes, ≥2 meaningful words) */
function looksLikeName(line: string): boolean {
  if (!line || line.length < 3) return false;
  // Must be all letters/spaces/punctuation
  if (!/^[A-Za-z\s.\-']+$/.test(line)) return false;
  // Reject lines containing any IC noise word (DUMMY IC, WARGANEGARA, etc.)
  if (hasIcNoiseWord(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    // Single-word lines like "ATKINSON" are handled separately in pass 1
    return false;
  }
  return words.length >= 2;
  // Single long word (some Chinese / surname-only cases)
  if (words.length === 1 && words[0].replace(/[.\-']/g, '').length >= 4) return true;
  return false;
}

/** Extract 5-digit postcode.
 * Use (?=[^0-9]|$) lookahead — matches "80009 KENINGAU" where 'K' is non-digit,
 * or "80009, CITY" where ',' is non-digit, or "80009" at end of string. */
function extractPostcode(text: string): string | null {
  const m = text.match(/\b(\d{5})(?=[^0-9]|$)/);
  return m ? m[1] : null;
}

/** Extract city + state from address text */
function extractCityState(addressText: string): { city: string; state: string } {
  const upper = addressText.toUpperCase();
  const lines = addressText.split(/\n/).map((l: string) => l.trim()).filter(Boolean);
  for (const state of MALAYSIA_STATES) {
    if (upper.includes(state)) {
      const stateIdx = lines.findIndex((l: string) => l.toUpperCase().includes(state));
      const city = stateIdx > 0 ? lines[stateIdx - 1].replace(/,\s*$/, '').trim() : '';
      return { city, state };
    }
  }
  return { city: '', state: '' };
}

// ─── IC helpers ───────────────────────────────────────────────────────────────

function parseIcComponents(normalized: string): { birthCode: string; serial4: string; icNumber: string } | null {
  const m = normalized.match(/(\d{6})\s*-\s*(\d{2})\s*-\s*(\d{4})/);
  if (!m) return null;
  return { birthCode: m[1], serial4: m[3], icNumber: `${m[1]}-${m[2]}-${m[3]}` };
}

function parseIcDob(yymmdd: string): string {
  try {
    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = parseInt(yymmdd.substring(2, 4), 10);
    const dd = parseInt(yymmdd.substring(4, 6), 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return '';
    const cur = new Date().getFullYear() - 2000;
    const year = yy <= cur ? 2000 + yy : 1900 + yy;
    return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  } catch { return ''; }
}

function deriveAge(dob: string): number {
  try {
    const [y, m, d] = dob.split('-').map(Number);
    const b = new Date(y, m - 1, d);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if ((t.getMonth() - b.getMonth()) * 100 + t.getDate() < (m - 1) * 100 + d) a--;
    return Math.max(0, a);
  } catch { return 0; }
}

function parseIcGender(serial4: string): 'male' | 'female' {
  return parseInt(serial4.slice(-1), 10) % 2 === 0 ? 'female' : 'male';
}

function normaliseName(caps: string): string {
  const LOWER = new Set(['BIN', 'BINTI', 'B.', 'A/L', 'A/P', 'LK', 'BT']);
  return caps.split(/\s+/).map((w, i) => {
    const u = w.toUpperCase();
    return LOWER.has(u) ? (i === 0 ? u : u.toLowerCase()) : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

// ─── MyKad extractor ──────────────────────────────────────────────────────────

export async function extractMyKad(imageBuffer: Buffer): Promise<ExtractionResult> {
  const tesseractBin = 'C:\\Program Files\\Tesseract-OCR';
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const tmpPath = path.join(tmpDir, 'cfp-ic-' + ts + '.jpg');
  const outBase = path.join(tmpDir, 'cfp-ic-' + ts);
  fs.writeFileSync(tmpPath, imageBuffer);

  try {
    const rawText = (await execTesseract(
      process.env.TESSERACT_PATH || 'tesseract',
      [tmpPath, outBase, '--oem', '1', '--psm', '4', '-l', 'mal+eng', 'txt'],
      tmpDir,
    )).trim();

    if (!rawText || rawText.length < 10) {
      return { success: false, error: 'OCR returned empty text. Please try a clearer photo.' };
    }

    const rawLines = rawText.split(/\n/).map((l: string) => l.trim()).filter(l => l.length > 0);
    const bd: Record<string, number> = {};

    // ── Step 1: Find IC number line ─────────────────────────────────────────
    // Try both raw and cleaned versions of each line
    let icNumber = '', birthCode = '', serial4 = '', icLineIdx = -1;

    for (let i = 0; i < rawLines.length; i++) {
      // Try raw line
      let result = parseIcComponents(rawLines[i].replace(/\s+/g, ''));
      if (!result) {
        // Try cleaned line
        const cleaned = cleanLine(rawLines[i]).replace(/\s+/g, '');
        result = parseIcComponents(cleaned);
      }
      if (result) {
        icNumber = result.icNumber;
        birthCode = result.birthCode;
        serial4 = result.serial4;
        icLineIdx = i;
        break;
      }
    }

    bd['ic_number'] = icNumber ? 30 : 0;
    if (!icNumber) {
      return { success: false, error: 'Could not find IC number. Ensure the IC is flat, well-lit, and fully in frame.', rawLines };
    }

    // ── Step 2: Extract name lines AFTER the IC line ─────────────────────────
    const afterIc = rawLines.slice(icLineIdx + 1);
    const nameLines: string[] = [];
    // Track address lines separately — when we hit address, check if last name
    // is a short single-word surname that should belong to the address instead
    const addressLines: string[] = [];
    let addressStarted = false;

    // ── Pass 1: collect name lines. Stop as soon as we hit anything that
    //    looks like an address (postcode / state / address keyword). ─────────
    let firstAddressIdx: number | null = null;
    let singleSurname: string | null = null; // holds a stray surname if it needs moving

    for (let i = 0; i < afterIc.length; i++) {
      const cleaned = cleanLine(afterIc[i]);
      if (!cleaned || isNoise(cleaned)) continue;

      // Postcode / state / address keyword → this is the start of address
      if (
        extractPostcode(cleaned) ||
        MALAYSIA_STATES.some(s => cleaned.toUpperCase().includes(s)) ||
        hasAddressKeyword(cleaned)
      ) {
        firstAddressIdx = i;
        break;
      }

      // Valid name line → add to name
      if (looksLikeName(cleaned)) {
        nameLines.push(cleaned);
      } else if (nameLines.length > 0) {
        // Short continuation of multi-line name (surname on separate line)
        const words = cleaned.split(/\s+/);
        const isIcNoise = hasIcNoiseWord(cleaned);
        if (words.length === 1 && words[0].length < 15 && !isIcNoise) {
          nameLines.push(cleaned);
        }
      } else {
        // nameLines still empty — single-word name like "ROWAN" or "SEBASTIAN"
        const words = cleaned.split(/\s+/);
        const isIcNoise = hasIcNoiseWord(cleaned);
        if (words.length === 1 && /^[A-Za-z\s.\-']+$/.test(cleaned) && cleaned.length < 20 && !isIcNoise) {
          nameLines.push(cleaned);
        }
      }
    }

    // If the last name line is a single short word, it's more likely a
    // stray surname that belongs to the first address line — unshift it there
    if (nameLines.length > 0 && nameLines[nameLines.length - 1].split(/\s+/).length === 1) {
      singleSurname = nameLines.pop()!;
    }

    // ── Pass 2: collect ALL address lines starting from firstAddressIdx ───────
    if (firstAddressIdx !== null) {
      for (let i = firstAddressIdx; i < afterIc.length; i++) {
        const cleaned = cleanLine(afterIc[i]);
        if (!cleaned || isNoise(cleaned)) continue;
        addressLines.push(cleaned);
      }
      // Prepend stray surname at front of address (if any)
      if (singleSurname) addressLines.unshift(singleSurname);
    } else {
      // No address trigger found — take everything after last name line as address
      addressLines.push(...afterIc.slice(nameLines.length).map(cleanLine).filter(l => l.length > 0));
    }

    // ── Fallback: if name still empty, collect all consecutive non-noise,
    //    non-address, non-IC-noise lines that look like names ─────────────────
    if (nameLines.length === 0) {
      for (const line of afterIc) {
        const cleaned = cleanLine(line);
        if (!cleaned || isNoise(cleaned)) continue;
        const upper = cleaned.toUpperCase();
        // Skip lines containing any IC noise word
        if (IC_NOISE_WORDS.has(upper) || hasIcNoiseWord(cleaned)) continue;
        // Stop at address boundary
        if (extractPostcode(cleaned) || MALAYSIA_STATES.some(s => upper.includes(s)) || hasAddressKeyword(cleaned)) {
          break;
        }
        // Only add if it actually looks like a name
        if (looksLikeName(cleaned)) {
          nameLines.push(cleaned);
        }
        if (nameLines.length >= 3) break;
      }
    }

    const fullNameRaw = nameLines.join(' ').replace(/[.\-,']+$/, '').trim();
    bd['name'] = fullNameRaw && fullNameRaw.length >= 2 ? 30 : 0;

    if (!fullNameRaw || fullNameRaw.length < 2) {
      return { success: false, error: 'Could not extract name. Please check the IC photo.', rawLines };
    }

    // ── Step 3: Address = addressLines we collected (rest of lines after name) ─
    const remainingAddressLines = addressLines.length > 0
      ? addressLines
      : afterIc.slice(nameLines.length).map(cleanLine).filter(l => l.length > 0);
    // Strip IC noise words (WARGANEGARA, LELAKI, PEREMPUAN, MALAYSIA, IC, etc.) from each line
    const cleanAddressLines = remainingAddressLines.map(stripIcNoiseWords).filter(l => l.length > 2);
    const addressFullRaw = cleanAddressLines.join(', ');
    const postcode = extractPostcode(addressFullRaw) || '';
    bd['postcode'] = postcode ? 20 : 0;

    const { state, city } = extractCityState(addressFullRaw);
    bd['state'] = state ? 10 : 0;
    bd['format'] = icNumber && postcode && state ? 20 : 0;

    const dob = parseIcDob(birthCode);
    const age = dob ? deriveAge(dob) : 0;
    const gender = serial4 ? parseIcGender(serial4) : 'male';
    const nameClean = normaliseName(fullNameRaw);
    const totalConfidence = Math.min(Object.values(bd).reduce((a, b) => a + b, 0) / 100, 1);

    return {
      success: true,
      rawLines,
      data: {
        icNumber,
        fullName: fullNameRaw,
        nameClean,
        dob,
        age,
        gender,
        nationality: 'Malaysian',
        addressLines: cleanAddressLines,
        addressFull: cleanAddressLines.join(', '),
        postcode,
        city,
        state,
        confidence: totalConfidence,
        confidenceBreakdown: bd,
      } as ParsedIC,
    };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('ENOENT') || msg.includes('spawn')) {
      return { success: false, error: 'Tesseract OCR is not installed or not found in PATH.' };
    }
    return { success: false, error: 'OCR processing failed: ' + msg };
  } finally {
    cleanup([tmpPath]);
    try { fs.unlinkSync(outBase + '.txt'); } catch {}
  }
}

// ─── Passport extractor ────────────────────────────────────────────────────────

export async function extractPassport(imageBuffer: Buffer): Promise<ExtractionResult> {
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const tmpPath = path.join(tmpDir, 'cfp-pass-' + ts + '.jpg');
  const outBase = path.join(tmpDir, 'cfp-pass-' + ts);
  fs.writeFileSync(tmpPath, imageBuffer);

  try {
    const text = (await execTesseract(
      process.env.TESSERACT_PATH || 'tesseract',
      [tmpPath, outBase, '--oem', '1', '--psm', '4', '-l', 'eng+mal', 'txt'],
      tmpDir,
    )).trim();

    if (!text) return { success: false, error: 'OCR returned empty text.' };

    const textLines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 2);

    // ── MRZ: find candidate lines ≥ 43 chars with '<<' (MRZ filler) ────────────
    // Strip non-MRZ chars, keep alphanumeric + '<'
    const candidates = textLines
      .map(l => l.replace(/[^A-Z0-9<]/g, ''))
      .filter(l => l.length >= 43);

    // Sort: longest first. Typical MRZ lines are exactly 44 chars (TD-3).
    candidates.sort((a, b) => b.length - a.length);

    // ── Declare all output variables upfront (avoid TDZ if branches skip) ─────
    let surname = '', givenNames = '', fullName = '';
    let passportNumber = '', dob = '', gender = '', expiryDate = '';
    const nationality = 'MALAYSIAN';

    // ── Identify name line vs data line ─────────────────────────────────────────
    let nameLine = '', dataLine = '';
    for (const c of candidates) {
      if (!nameLine && c.startsWith('P<') && (c.split('<<').length >= 3)) {
        nameLine = c;
      } else if (!dataLine && (/\d{6}/.test(c) || c.startsWith('$'))) {
        dataLine = c;
      }
      if (nameLine && dataLine) break;
    }

    // Parse name line: P<TYPE<NATIONALITY<SURNAME<<GIVEN<<<<<<...
    if (nameLine) {
      const parts = nameLine.split('<').filter(Boolean);
      // parts[0] = 'P', parts[1] = type, parts[2] = nationality, rest = name
      surname = (parts[3] || '').trim();
      givenNames = parts.slice(4).join(' ').replace(/</g, ' ').trim();
      fullName = [surname, givenNames].filter(Boolean).join(', ');
    }

    // Parse data line
    if (dataLine) {
      // Strip leading '$' or other garbage that OCR prepends
      const d = dataLine.replace(/^\$+/, '');

      // Passport number: first sequence of 8-9 digits
      const pn = d.match(/\d{8,9}/);
      if (pn) passportNumber = pn[0];

      // Birthdate: exactly 6 digits, check digit (1 digit), then sex (F/M/<)
      // YYMMDDcheck(sex) — e.g. "8704234F" or "8704234M"
      const dobM = d.match(/(\d{6})\d(?=[FM<])/);
      if (dobM) {
        const [yy, mm, dd] = [dobM[1].slice(0,2), dobM[1].slice(2,4), dobM[1].slice(4,6)];
        if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) {
          const cur = new Date().getFullYear() - 2000;
          const year = parseInt(yy) <= cur ? 2000 + parseInt(yy) : 1900 + parseInt(yy);
          dob = `${year}-${mm}-${dd}`;
        }
      }

      // Expiry date: 6 digits check 7 digits (not 6!) sex — TD-3 format
      // e.g. "...3208265F..." where 320826 is YYMMDD
      const expM = d.match(/\d{6}\d{7}(?=[FM<]|$)/);
      if (expM) {
        const exp = expM[0].slice(6, 12);
        const [yy, mm, dd] = [exp.slice(0,2), exp.slice(2,4), exp.slice(4,6)];
        if (parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) {
          const cur = new Date().getFullYear() - 2000;
          const year = parseInt(yy) <= cur ? 2000 + parseInt(yy) : 1900 + parseInt(yy);
          expiryDate = `${year}-${mm}-${dd}`;
        }
      }

      // Sex: F or M
      const sexM = d.match(/[FM]\d{6}\d[FM]/);
      if (sexM) gender = sexM[0][0];
    }

    // ── Fallback: plain text ──────────────────────────────────────────────────
    if (!passportNumber) {
      const numMatch = text.match(/\b([A-Z]{1,2}\d{7,9})\b/i);
      if (numMatch) passportNumber = numMatch[1].toUpperCase();
    }

    if (!fullName || !surname) {
      for (let i = 0; i < textLines.length; i++) {
        const upper = textLines[i].toUpperCase();
        if (upper.includes('SURNAME') && i + 1 < textLines.length) {
          surname = cleanLine(textLines[i + 1]).toUpperCase();
          if (textLines[i + 2]) givenNames = cleanLine(textLines[i + 2]).toUpperCase();
          fullName = [surname, givenNames].filter(Boolean).join(', ');
          break;
        }
      }
    }

    const confidence = passportNumber && fullName ? 0.88 : passportNumber || fullName ? 0.60 : 0;
    const success = !!(passportNumber && fullName);

    return {
      success,
      rawLines: textLines,
      data: { passportNumber, fullName, surname, givenNames, nationality, dob, expiryDate, gender, confidence } as ParsedPassport,
      error: success ? undefined : 'Could not extract all passport fields.',
    };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('ENOENT') || msg.includes('spawn')) return { success: false, error: 'Tesseract OCR is not installed.' };
    return { success: false, error: 'OCR failed: ' + msg };
  } finally {
    cleanup([tmpPath]);
    try { fs.unlinkSync(outBase + '.txt'); } catch {}
  }
}
