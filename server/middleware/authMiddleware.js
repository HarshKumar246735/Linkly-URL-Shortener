import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Returns the user for a valid auth cookie, or null. Never trusts client-supplied ids. */
async function resolveUser(req) {
  const token = req.cookies?.[config.cookieName];
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return null; // malformed, tampered or expired
  }
  if (typeof payload.sub !== 'string' || !OBJECT_ID.test(payload.sub)) return null;
  return User.findById(payload.sub);
}

export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return next(new ApiError(401, 'Please log in to continue.', { code: 'AUTH_REQUIRED' }));
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
