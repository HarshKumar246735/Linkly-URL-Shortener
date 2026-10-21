import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req[source] with a Zod schema. The parsed (typed, trimmed, normalised)
 * data is stored on req.validated[source]; handlers never read raw input.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(new ApiError(422, details[0].message, { code: 'VALIDATION_ERROR', details }));
  }
  req.validated = { ...req.validated, [source]: result.data };
  return next();
};
