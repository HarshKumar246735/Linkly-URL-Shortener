import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function createLimiter({ windowMs, max, message, skip, keyGenerator }) {
  const options = {
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Rate limiting is disabled in tests unless a test explicitly enables it.
    skip: (req, res) => (config.isTest && !process.env.ENABLE_RATE_LIMIT_TESTS) || (skip ? skip(req, res) : false),
    handler: (_req, _res, next) => next(new ApiError(429, message, { code: 'RATE_LIMITED' })),
  };
  if (keyGenerator) options.keyGenerator = keyGenerator;
  return rateLimit(options);
}

/** Generic ceiling for every /api request. */
export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  max: 600,
  message: 'Too many requests. Please slow down and try again shortly.',
});

/** Login and registration: slows down credential stuffing and account spam. */
export const authLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  max: 20,
  message: 'Too many attempts. Please wait a few minutes and try again.',
});

/** Anonymous link creation, limited per IP address. */
export const anonymousShortenLimiter = createLimiter({
  windowMs: HOUR,
  max: 15,
  skip: (req) => Boolean(req.user),
  message: 'Anonymous link limit reached. Create a free account for a higher limit, or try again later.',
});

/** Authenticated link creation, limited per user. */
export const authenticatedShortenLimiter = createLimiter({
  windowMs: HOUR,
  max: 120,
  skip: (req) => !req.user,
  keyGenerator: (req) => `user:${req.user._id}`,
  message: 'You are creating links too quickly. Please try again later.',
});

/** Public redirects, per IP. Generous, but stops trivial scraping loops. */
export const redirectLimiter = createLimiter({
  windowMs: MINUTE,
  max: 300,
  message: 'Too many requests. Please try again in a minute.',
});
