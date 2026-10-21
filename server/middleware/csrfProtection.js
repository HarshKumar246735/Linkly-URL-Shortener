import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated, cross-origin deployments (SameSite=None).
 *  1. If the browser sends an Origin header on a state-changing request it must be an allowed client origin.
 *  2. Requests that carry the auth cookie must also send "X-Requested-With: XMLHttpRequest".
 *     A custom header forces a CORS preflight, which only allowed origins can pass.
 * This is layered on top of strict CORS and (in same-site setups) SameSite cookies.
 */
export function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const { origin } = req.headers;
  if (origin && !config.clientOrigins.includes(origin)) {
    return next(new ApiError(403, 'Request origin is not allowed.', { code: 'CSRF_ORIGIN' }));
  }

  if (req.cookies?.[config.cookieName] && req.get('x-requested-with') !== 'XMLHttpRequest') {
    return next(new ApiError(403, 'Missing required request header.', { code: 'CSRF_HEADER' }));
  }
  return next();
}
