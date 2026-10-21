const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  410: 'GONE',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
};

/** An error that is safe to show to the client. */
export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || DEFAULT_CODES[status] || 'ERROR';
    this.details = details;
  }
}
