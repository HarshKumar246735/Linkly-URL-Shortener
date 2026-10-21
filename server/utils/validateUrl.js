import { config } from '../config/env.js';

export const MAX_URL_LENGTH = 2048;

const PRIVATE_IPV4 = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./];
const INTERNAL_SUFFIXES = ['.localhost', '.local', '.internal', '.lan'];

function isInternalHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return PRIVATE_IPV4.some((pattern) => pattern.test(host));
  if (host.startsWith('[')) return host === '[::1]' || host === '[::]' || /^\[(fc|fd|fe80)/.test(host);
  return false;
}

/**
 * Validates a destination URL.
 * Returns { ok: true, url } with the normalised URL, or { ok: false, reason }.
 */
export function validateDestinationUrl(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'URL must be text.' };

  const value = input.trim();
  if (!value) return { ok: false, reason: 'URL is required.' };
  if (value.length > MAX_URL_LENGTH) {
    return { ok: false, reason: `URL must be ${MAX_URL_LENGTH} characters or fewer.` };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: 'Please enter a valid URL, for example https://example.com/page.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs can be shortened.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'URLs containing a username or password are not allowed.' };
  }

  // Prevent redirect loops back into the shortener itself.
  try {
    if (parsed.host.toLowerCase() === new URL(config.baseUrl).host.toLowerCase()) {
      return { ok: false, reason: 'You cannot shorten a link that already points to Linkly.' };
    }
  } catch {
    /* BASE_URL validity is checked elsewhere */
  }

  // In production, refuse loopback / private-network targets.
  if (config.isProduction && isInternalHost(parsed.hostname)) {
    return { ok: false, reason: 'Links to local or private network addresses are not allowed.' };
  }

  return { ok: true, url: parsed.href };
}

/** Last-line check used right before redirecting a stored URL. */
export function isSafeRedirectTarget(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
