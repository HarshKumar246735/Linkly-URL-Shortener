// Alias / short-code policy (documented in the README):
//   3-32 characters, letters, digits, hyphen and underscore. Case-sensitive.
export const ALIAS_MIN_LENGTH = 3;
export const ALIAS_MAX_LENGTH = 32;
export const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

// Paths that belong to the application and must never be claimed as aliases.
export const RESERVED_CODES = new Set([
  'api', 'login', 'logout', 'register', 'signup', 'dashboard', 'admin', 'assets', 'static',
  'health', 'favicon', 'robots', 'sitemap', 'settings', 'profile', 'account', 'links',
  'about', 'privacy', 'terms', 'help', 'support', 'index', 'www', 'app', 'null', 'undefined',
]);

export const isReservedCode = (code) => RESERVED_CODES.has(String(code).toLowerCase());
export const isValidCodeFormat = (code) => typeof code === 'string' && ALIAS_PATTERN.test(code);
