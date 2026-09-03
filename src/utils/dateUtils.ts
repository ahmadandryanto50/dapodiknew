// Utility helper for flexible date parsing and formatting across App UI and Database

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_MAP_ID: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, ags: 8,
  september: 9, sep: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  desember: 12, des: 12
};

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Strips ISO time portion ("T16:00:00.000Z", etc.) from any date string or object.
 */
export function stripIsoTime(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('T')) {
    return str.split('T')[0].trim();
  }
  return str;
}

/**
 * Parses any date representation (ISO "2026-06-01T16:00:00.000Z", "1991-08-09", Indonesian "01 Juni 1991", "1/6/1991", Excel number, etc.)
 * Strictly isolates year, month, day without ISO time or timezone offset interference.
 */
export function parseFlexibleDate(val: any): ParsedDate | null {
  if (val === null || val === undefined) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return { year: val.getFullYear(), month: val.getMonth() + 1, day: val.getDate() };
  }

  // Handle full ISO timestamp strings with timezone info before stripping (e.g. "2026-06-01T17:00:00.000Z")
  if (typeof val === 'string' && val.includes('T') && (val.endsWith('Z') || val.includes('+') || val.match(/-\d{2}:\d{2}$/))) {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
    }
  }

  if (typeof val === 'number') {
    // Excel serial date number
    const parsed = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(parsed.getTime())) {
      return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
    }
    return null;
  }

  // Clean raw string by stripping any ISO time (e.g. T16:00:00.000Z)
  const str = stripIsoTime(val);
  if (!str || str === '-' || str === '0') return null;

  // Pattern 1: ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Pattern 3: Text "01 Juni 1991" or "1 Juni 1991" or "15 Agustus 1985"
  const textMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);
    const month = MONTH_MAP_ID[monthStr];
    if (month && year > 1900 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Fallback: JS Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  return null;
}

/**
 * Converts any date representation into Indonesian formatted string: e.g. "01 Juni 1991" or "09 Agustus 1991".
 * Guarantees no raw ISO strings (e.g., 2026-06-01T16:00:00.000Z) are returned.
 */
export function formatDateIndonesian(val: any, padZero: boolean = true): string {
  if (!val) return '-';
  const parsed = parseFlexibleDate(val);
  if (!parsed) {
    const cleanStr = stripIsoTime(val);
    return cleanStr || '-';
  }

  const dayStr = padZero ? String(parsed.day).padStart(2, '0') : String(parsed.day);
  const monthStr = MONTH_NAMES_ID[parsed.month - 1] || '';
  return `${dayStr} ${monthStr} ${parsed.year}`;
}

/**
 * Converts any date representation into ISO format "YYYY-MM-DD" without time/timezone.
 */
export function formatDateISO(val: any): string {
  if (!val) return '';
  const parsed = parseFlexibleDate(val);
  if (!parsed) {
    return stripIsoTime(val);
  }

  const m = String(parsed.month).padStart(2, '0');
  const d = String(parsed.day).padStart(2, '0');
  return `${parsed.year}-${m}-${d}`;
}

/**
 * Formats a date string safely for HTML <input type="date"> value attribute ("YYYY-MM-DD").
 */
export function formatDateForInput(val: any): string {
  return formatDateISO(val);
}

/**
 * Normalizes any date string (ISO timestamps, raw strings, etc.) into clean standard format.
 * Defaults to Indonesian format "01 Juni 2026" or clean ISO "2026-06-01".
 */
export function normalizeDate(val: any, mode: 'indonesia' | 'iso' = 'indonesia'): string {
  if (!val) return '';
  return mode === 'indonesia' ? formatDateIndonesian(val) : formatDateISO(val);
}

