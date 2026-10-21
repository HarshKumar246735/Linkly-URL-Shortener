import dotenv from 'dotenv';

dotenv.config();

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses values such as "30m", "12h" or "7d" into milliseconds. Returns null when invalid. */
export function parseDurationMs(value) {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(value ?? '').trim());
  if (!match) return null;
  const unit = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: DAY_MS }[match[2].toLowerCase()];
  return Number(match[1]) * unit;
}

const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const port = Number(process.env.PORT) || 5000;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
const cookieSameSite = (process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();

export const config = Object.freeze({
  nodeEnv,
  isProduction,
  isTest: nodeEnv === 'test',
  port,
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn,
  cookieName: 'linkly_token',
  cookieSameSite,
  // Browsers reject SameSite=None cookies that are not Secure.
  cookieSecure: isProduction || cookieSameSite === 'none',
  cookieMaxAgeMs: parseDurationMs(jwtExpiresIn) ?? 7 * DAY_MS,
  clientOrigins: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => stripTrailingSlash(origin.trim()))
    .filter(Boolean),
  baseUrl: stripTrailingSlash(process.env.BASE_URL || `http://localhost:${port}`),
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  bcryptRounds: nodeEnv === 'test' ? 4 : 12,
});

/** Fails fast with a readable message when required configuration is missing or unsafe. */
export function validateEnv() {
  const problems = [];

  if (!config.mongodbUri) problems.push('MONGODB_URI is required.');
  if (config.jwtSecret.length < 32) problems.push('JWT_SECRET is required and must be at least 32 characters long.');
  if (parseDurationMs(config.jwtExpiresIn) === null) problems.push('JWT_EXPIRES_IN must look like 30m, 12h or 7d.');
  if (!['lax', 'strict', 'none'].includes(config.cookieSameSite)) {
    problems.push('COOKIE_SAME_SITE must be one of: lax, strict, none.');
  }
  if (config.isProduction) {
    if (!process.env.CLIENT_URL) problems.push('CLIENT_URL is required in production.');
    if (!process.env.BASE_URL) problems.push('BASE_URL is required in production.');
    if (config.clientOrigins.includes('*')) problems.push('CLIENT_URL must not be a wildcard.');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }
}
