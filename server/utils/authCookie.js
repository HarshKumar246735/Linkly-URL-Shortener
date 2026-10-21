import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: '/',
});

export function signToken(userId) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export function setAuthCookie(res, userId) {
  res.cookie(config.cookieName, signToken(userId), { ...baseCookieOptions(), maxAge: config.cookieMaxAgeMs });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, baseCookieOptions());
}
