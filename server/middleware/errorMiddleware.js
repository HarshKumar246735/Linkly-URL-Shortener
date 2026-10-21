import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { renderMessagePage } from '../utils/htmlPages.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'The requested resource was not found.', { code: 'NOT_FOUND' }));
}

const PAGE_TITLES = {
  LINK_NOT_FOUND: 'Link not found',
  LINK_INACTIVE: 'Link disabled',
  LINK_EXPIRED: 'Link expired',
  RATE_LIMITED: 'Slow down a little',
  NOT_FOUND: 'Page not found',
};

function normalise(error) {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message, details: error.details };
  }
  if (error?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'The request body contains invalid JSON.' };
  }
  if (error?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' };
  }
  if (error?.name === 'ValidationError' && error.errors) {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    return { status: 422, code: 'VALIDATION_ERROR', message: details[0]?.message || 'Validation failed.', details };
  }
  if (error?.name === 'CastError') {
    return { status: 400, code: 'BAD_REQUEST', message: 'Invalid identifier.' };
  }
  if (error?.code === 11000) {
    return { status: 409, code: 'CONFLICT', message: 'A record with that value already exists.' };
  }
  if (['MongooseServerSelectionError', 'MongoNetworkError', 'MongoServerSelectionError'].includes(error?.name)) {
    return { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'The database is temporarily unavailable. Please try again.' };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again later.' };
}

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const { status, code, message, details } = normalise(error);

  if (status >= 500 && !config.isTest) {
    // Log the stack server-side only; it is never sent to the client.
    console.error(`[error] ${req.method} ${req.path}`, error?.stack || error);
  }

  if (/^\/api(\/|\?|$)/.test(req.originalUrl)) {
    return res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
  }

  // Public short-link visitors get a friendly HTML page instead of JSON.
  return res
    .status(status)
    .set('Cache-Control', 'no-store')
    .type('html')
    .send(renderMessagePage({ title: PAGE_TITLES[code] || 'Something went wrong', message }));
}
