// Utility helper for flexible date parsing and formatting across App UI and Database

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_MAP_ID: Record<string, number> = {
  januari: 1, jan: 1, january: 1,
  februari: 2, feb: 2, february: 2,
  maret: 3, mar: 3, march: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6, june: 6,
  juli: 7, jul: 7, july: 7,
  agustus: 8, agu: 8, ags: 8, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, october: 10, oct: 10,
  november: 11, nov: 11, nopember: 11, nop: 11,
  desember: 12, des: 12, december: 12, dec: 12
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
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getUTCHours() === 0 ? val.getUTCFullYear() : val.getFullYear();
    const m = String((val.getUTCHours() === 0 ? val.getUTCMonth() : val.getMonth()) + 1).padStart(2, '0');
    const d = String(val.getUTCHours() === 0 ? val.getUTCDate() : val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('T')) {
    return str.split('T')[0].trim();
  }
  return str;
}

/**
 * Parses any date representation (ISO "2011-11-07T00:00:00.000Z", "2011-11-07", Indonesian "07 November 2011", "07/11/2011", Excel number 40854, etc.)
 * Strictly isolates year, month, day without ISO time or timezone offset interference.
 */
export function parseFlexibleDate(val: any): ParsedDate | null {
  if (val === null || val === undefined || val === '') return null;

  // 1. Native Date Object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    // When created from ISO string or XLSX cellDates (e.g. 2011-11-07T00:00:00.000Z)
    if (val.getUTCHours() === 0 && val.getUTCMinutes() === 0) {
      return { year: val.getUTCFullYear(), month: val.getUTCMonth() + 1, day: val.getUTCDate() };
    }
    return { year: val.getFullYear(), month: val.getMonth() + 1, day: val.getDate() };
  }

  // 2. Check for numeric Excel serial date (e.g. 40854 or "40854" or "40854.0")
  let numVal: number | null = null;
  if (typeof val === 'number') {
    numVal = val;
  } else if (typeof val === 'string') {
    const cleanNum = val.trim();
    if (/^\d{5}(\.\d+)?$/.test(cleanNum)) {
      numVal = parseFloat(cleanNum);
    }
  }

  if (numVal !== null && !isNaN(numVal) && numVal > 10000 && numVal < 100000) {
    // Excel date serial number (e.g. 40854 = 2011-11-07)
    // Excel epoch offset to Unix Epoch (1970-01-01) is 25569 days
    const utcDays = numVal - 25569;
    const utcMs = Math.round(utcDays * 86400 * 1000);
    const d = new Date(utcMs);
    if (!isNaN(d.getTime())) {
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    }
  }

  const rawStr = String(val).trim();
  if (!rawStr || rawStr === '-' || rawStr === '0') return null;

  // Handle ISO timestamp string with 'T' (e.g. "2011-11-07T00:00:00.000Z")
  if (rawStr.includes('T')) {
    const datePart = rawStr.split('T')[0].trim();
    const parts = datePart.split(/[-/]/);
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { year, month, day };
      }
    }
    const d = new Date(rawStr);
    if (!isNaN(d.getTime())) {
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    }
  }

  // Pattern 1: ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = rawStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY (Indonesian standard)
  const dmyMatch = rawStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Pattern 3: Text Indonesian / English Date e.g. "07 November 2011", "7 Nopember 2011", "7 Nov 2011"
  const textMatch = rawStr.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);
    const month = MONTH_MAP_ID[monthStr];
    if (month && year > 1900 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // Fallback JS Date parsing using UTC getter if possible
  const d = new Date(rawStr);
  if (!isNaN(d.getTime()) && d.getUTCFullYear() > 1900) {
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }

  return null;
}

/**
 * Ensures code/number fields (NISN, NIS, NIK, NUPTK, NIP, HP/Telepon, RT, RW, Kode Pos, No KK, etc.)
 * preserve leading zeros ("006262662", "0851737362626") when loaded, imported, or stored.
 */
export function cleanLeadingZerosCode(val: any, fieldName?: string): string {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) return '';

  let str = String(val).trim();

  // Handle scientific notation e.g. "8.51737e+12" or float from Excel
  if (/^\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
    try {
      str = BigInt(Math.round(Number(val))).toString();
    } catch (e) {
      // ignore
    }
  } else if (typeof val === 'number') {
    str = Math.floor(val) === val ? String(val) : str;
  }

  // Remove trailing .0 from Excel number parsing if present e.g. "0085173.0" -> "0085173"
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }

  const fName = (fieldName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // If already starts with '0', preserve exact string (e.g. "006262662", "0851737362626")
  if (str.startsWith('0')) {
    return str;
  }

  // 1. Phone / HP / Telepon: e.g. "851737362626" -> "0851737362626"
  if (fName.includes('hp') || fName.includes('telepon') || fName.includes('phone') || fName.includes('wa')) {
    if (/^8\d{8,12}$/.test(str)) {
      return '0' + str;
    }
  }

  // 2. NISN: 10 digits in Indonesia. If lost leading 0s (e.g. "6262662" -> 7 digits)
  if (fName.includes('nisn')) {
    if (/^\d{6,9}$/.test(str)) {
      return str.padStart(10, '0');
    }
  }

  // 3. RT / RW: 3 digits e.g. "1" or "2" -> "001", "002"
  if (fName === 'rt' || fName === 'rw') {
    if (/^\d{1,2}$/.test(str)) {
      return str.padStart(3, '0');
    }
  }

  // 4. Kode Pos: 5 digits
  if (fName.includes('kodepos') || fName.includes('kode pos')) {
    if (/^\d{4}$/.test(str)) {
      return '0' + str;
    }
  }

  // 5. NIK / No KK: 16 digits
  if (fName.includes('nik') || fName.includes('nokk') || fName.includes('kk')) {
    if (/^\d{14,15}$/.test(str)) {
      return str.padStart(16, '0');
    }
  }

  // 6. NUPTK: 16 digits
  if (fName.includes('nuptk')) {
    if (/^\d{14,15}$/.test(str)) {
      return str.padStart(16, '0');
    }
  }

  // 7. NIP: 18 digits
  if (fName.includes('nip')) {
    if (/^\d{16,17}$/.test(str)) {
      return str.padStart(18, '0');
    }
  }

  return str;
}

/**
 * Converts any date representation into Indonesian formatted string: e.g. "07 November 2011".
 * Guarantees no raw ISO strings or wrong dates are returned.
 */
export function formatDateIndonesian(val: any, padZero: boolean = true): string {
  if (val === null || val === undefined || val === '') return '-';
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
  if (val === null || val === undefined || val === '') return '';
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

