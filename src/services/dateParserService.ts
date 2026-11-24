import * as chrono from 'chrono-node';

export type ParsedDateResult = {
  date: Date;
  confidence: 'high' | 'medium' | 'low';
} | null;

const REASONABLE_YEAR_MIN = 1990;
const REASONABLE_YEAR_MAX = new Date().getFullYear() + 1;

const NUMERIC_DATE_PATTERNS: Array<{ regex: RegExp; build: (m: RegExpMatchArray) => Date | null }> = [
  // yyyy-mm-dd or yyyy/mm/dd
  {
    regex: /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/,
    build: (m) => makeDate(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  // dd-mm-yyyy or dd/mm/yyyy (preferred, common in India/EU)
  {
    regex: /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/,
    build: (m) => makeDate(Number(m[3]), Number(m[2]), Number(m[1])),
  },
  // dd[-/. ]Mon[-/. ]yyyy or yy   "20-May-26", "20 May 2026", "20.May.26"
  {
    regex: /\b(\d{1,2})[-/.\s]([A-Za-z]{3,9})[-/.\s](\d{2,4})\b/,
    build: (m) => {
      const month = parseMonthName(m[2]);
      if (!month) return null;
      return makeDate(expandYear(Number(m[3])), month, Number(m[1]));
    },
  },
  // Mon dd, yyyy or yy  "March 12, 2026" / "May 20, 26"
  {
    regex: /\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})\b/,
    build: (m) => {
      const month = parseMonthName(m[1]);
      if (!month) return null;
      return makeDate(expandYear(Number(m[3])), month, Number(m[2]));
    },
  },
  // dd-mm-yy or dd/mm/yy (2-digit year)
  {
    regex: /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/,
    build: (m) => makeDate(expandYear(Number(m[3])), Number(m[2]), Number(m[1])),
  },
];

function expandYear(year: number): number {
  if (year >= 1000) return year;
  // 2-digit years: 00-79 → 2000-2079, 80-99 → 1980-1999
  return year < 80 ? 2000 + year : 1900 + year;
}

export function parseDateFromText(text: string): ParsedDateResult {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();

  for (const pattern of NUMERIC_DATE_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const candidate = pattern.build(match);
      if (candidate && isReasonable(candidate)) {
        return { date: candidate, confidence: 'high' };
      }
    }
  }

  const chronoResults = chrono.parse(normalized);
  for (const result of chronoResults) {
    const date = result.start.date();
    if (isReasonable(date) && result.start.isCertain('day')) {
      return { date, confidence: 'medium' };
    }
  }
  for (const result of chronoResults) {
    const date = result.start.date();
    if (isReasonable(date)) {
      return { date, confidence: 'low' };
    }
  }
  return null;
}

function makeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function isReasonable(date: Date): boolean {
  const year = date.getFullYear();
  return year >= REASONABLE_YEAR_MIN && year <= REASONABLE_YEAR_MAX;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function parseMonthName(input: string): number | null {
  return MONTH_NAMES[input.toLowerCase()] ?? null;
}
