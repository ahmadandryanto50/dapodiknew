/**
 * Processes image URLs for reliable display across all browsers, mobile devices, and Google Sheets integrations.
 * - Converts Google Drive share/view URLs to direct high-res content URLs (lh3.googleusercontent.com/d/ID)
 * - Converts Dropbox view links to direct raw links
 * - Validates raw base64 data URIs and adds necessary MIME prefixes
 * - Provides reliable fallback handling
 */
export function formatImageUrl(url?: string | null, fallbackUrl: string = '/logo_smpn11palu.jpg'): string {
  if (!url || typeof url !== 'string') return fallbackUrl;
  const trimmed = url.trim();
  if (!trimmed) return fallbackUrl;

  // 1. Google Drive URL detection and conversion
  const driveFileIdMatch = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=|thumbnail\?id=)|docs\.google\.com\/uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveFileIdMatch && driveFileIdMatch[1]) {
    const fileId = driveFileIdMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. Dropbox URL conversion
  if (trimmed.includes('dropbox.com') && !trimmed.includes('raw=1')) {
    return trimmed.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
  }

  // 3. Raw Base64 string without data prefix
  if (!trimmed.startsWith('http') && !trimmed.startsWith('data:') && !trimmed.startsWith('/') && !trimmed.startsWith('./')) {
    if (trimmed.length > 30 && /^[A-Za-z0-9+/=]+$/.test(trimmed.substring(0, 30))) {
      if (trimmed.startsWith('/9j/')) {
        return `data:image/jpeg;base64,${trimmed}`;
      } else if (trimmed.startsWith('iVBORw0KGgo')) {
        return `data:image/png;base64,${trimmed}`;
      } else if (trimmed.startsWith('R0lGOD')) {
        return `data:image/gif;base64,${trimmed}`;
      } else if (trimmed.startsWith('PHN2Zw')) {
        return `data:image/svg+xml;base64,${trimmed}`;
      } else {
        return `data:image/jpeg;base64,${trimmed}`;
      }
    }
  }

  return trimmed;
}
