export function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/** ISO string -> value for <input type="datetime-local"> in the visitor's local time. */
export function toLocalInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local value -> UTC ISO string (or undefined when empty). */
export function localInputToIso(value) {
  return value ? new Date(value).toISOString() : undefined;
}

export function getShortCode(shortUrl) {
  try {
    return new URL(shortUrl).pathname.replace(/^\/+/, '') || 'link';
  } catch {
    return 'link';
  }
}

export const qrFilename = (shortUrl) => `linkly-qr-${getShortCode(shortUrl)}.png`;

export const displayShortUrl = (shortUrl) => shortUrl.replace(/^https?:\/\//, '');
