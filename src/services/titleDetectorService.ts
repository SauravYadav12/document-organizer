const BUSINESS_SUFFIX = /\b(pvt\.?|private|ltd\.?|limited|inc\.?|llc|llp|corp\.?|corporation|co\.?|company|enterprises?|industries|traders?|associates?|consultants?|solutions?|services?|group|holdings|gmbh|sa|s\.a\.|sarl|bv|ag)\b/i;

const DROP_KEYWORDS = [
  'invoice', 'tax invoice', 'receipt', 'bill', 'quotation', 'estimate',
  'sales order', 'purchase order', 'delivery challan', 'credit note',
  'debit note', 'voucher', 'statement', 'duplicate', 'original',
  'cash memo', 'bill of supply', 'proforma',
];

const HEADER_LABELS = [
  'gstin', 'gst', 'pan', 'tin', 'cin', 'iec', 'vat',
  'consignee', 'buyer', 'seller', 'shipper', 'recipient',
  'phone', 'mobile', 'tel', 'fax', 'email', 'e-mail',
  'address', 'date', 'dated', 'invoice no', 'invoice #',
  'state name', 'place of supply', 'hsn', 'sac',
];

const MAX_TITLE_LEN = 60;

export function detectTitleFromOcrText(text: string | null | undefined): string | null {
  if (!text) return null;
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  const top = rawLines.slice(0, 14);
  const plausible = top
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isPlausibleTitle(line));

  if (plausible.length === 0) return null;

  const scored = plausible
    .map(({ line, index }) => ({ line, score: scoreTitleLine(line, index) }))
    .sort((a, b) => b.score - a.score);

  const winner = scored[0];
  if (winner.score <= 0) return null;
  return tidy(winner.line);
}

function scoreTitleLine(line: string, indexFromTop: number): number {
  let score = 0;
  // Prefer near top — top line +6, second +4, ...
  score += Math.max(0, 6 - indexFromTop);

  if (BUSINESS_SUFFIX.test(line)) score += 8;
  if (isMostlyUpper(line) && line.length >= 4) score += 4;
  if (/^[A-Z][a-z]/.test(line)) score += 2; // Title Case-ish start

  const wordCount = line.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2 && wordCount <= 8) score += 3;
  if (wordCount > 12) score -= 4;

  const digitCount = (line.match(/\d/g) ?? []).length;
  const letterCount = (line.match(/[A-Za-z]/g) ?? []).length;
  if (digitCount > 0 && digitCount / Math.max(letterCount, 1) > 0.25) score -= 5;
  if (/,\s*\d/.test(line)) score -= 4; // address-ish "..., 5"
  if (/\b\d{6}\b/.test(line)) score -= 4; // pin/zip code
  if (/[#@/\\]/.test(line)) score -= 3;

  return score;
}

function isPlausibleTitle(line: string): boolean {
  if (line.length < 3 || line.length > 100) return false;
  if (!/[A-Za-z]/.test(line)) return false;
  if (/^\d[\d\s\-/.,:]*$/.test(line)) return false;
  if (/^[\W_]+$/.test(line)) return false;

  const lower = line.toLowerCase();
  if (DROP_KEYWORDS.some((kw) => lower === kw || lower.startsWith(`${kw}:`) || lower.startsWith(`${kw} `))) {
    return false;
  }
  if (HEADER_LABELS.some((kw) => lower.startsWith(`${kw}:`) || lower.startsWith(`${kw} :`) || lower === kw)) {
    return false;
  }
  if (/^(http|www\.|@)/.test(lower)) return false;
  if (/\b\d{10}\b/.test(line) && !/[A-Za-z]{3,}/.test(line)) return false;
  return true;
}

function isMostlyUpper(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.75;
}

function tidy(line: string): string {
  const cleaned = line
    .replace(/[|*•·]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\W_]+|[\W_]+$/g, '')
    .trim();
  if (cleaned.length <= MAX_TITLE_LEN) return cleaned;
  return `${cleaned.slice(0, MAX_TITLE_LEN - 1).trimEnd()}…`;
}
