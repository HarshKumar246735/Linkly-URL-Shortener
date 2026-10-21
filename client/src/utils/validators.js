// Client-side validation gives instant feedback; the server remains the source of truth.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
export const RESERVED_ALIASES = [
  'api', 'login', 'logout', 'register', 'signup', 'dashboard', 'admin', 'assets', 'static', 'health',
  'favicon', 'robots', 'sitemap', 'settings', 'profile', 'account', 'links', 'about', 'privacy',
  'terms', 'help', 'support', 'index', 'www', 'app', 'null', 'undefined',
];

export function validateName(value) {
  const name = value.trim();
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > 60) return 'Name must be 60 characters or fewer.';
  return '';
}

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Email is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 72) return 'Password must be 72 characters or fewer.';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter.';
  if (!/\d/.test(value)) return 'Password must contain at least one number.';
  return '';
}

export function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: confirmPassword === password ? '' : 'Passwords do not match.',
  };
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function validateLoginForm({ email, password }) {
  const errors = { email: validateEmail(email), password: password ? '' : 'Password is required.' };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/** Adds https:// when the visitor typed "example.com/page" without a scheme. */
export function normalizeUrlInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (/^(javascript|data|file|vbscript|mailto|tel):/i.test(trimmed)) return trimmed; // let validation reject these
  return `https://${trimmed}`;
}

export function validateUrlInput(value) {
  if (!value.trim()) return 'Please enter a URL to shorten.';
  let parsed;
  try {
    parsed = new URL(normalizeUrlInput(value));
  } catch {
    return 'That does not look like a valid URL.';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'Only http and https URLs can be shortened.';
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return 'That does not look like a valid URL.';
  if (value.length > 2048) return 'URL must be 2048 characters or fewer.';
  return '';
}

export function validateAlias(value) {
  const alias = value.trim();
  if (!alias) return '';
  if (!ALIAS_PATTERN.test(alias)) return 'Use 3-32 letters, numbers, hyphens or underscores.';
  if (RESERVED_ALIASES.includes(alias.toLowerCase())) return 'That alias is reserved. Please choose another one.';
  return '';
}

/** `value` comes from <input type="datetime-local"> (local time, no timezone). */
export function validateExpiry(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Please enter a valid date and time.';
  if (date.getTime() <= Date.now()) return 'Expiration must be in the future.';
  return '';
}
