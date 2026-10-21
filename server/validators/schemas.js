import { z } from 'zod';
import { ALIAS_MAX_LENGTH, ALIAS_MIN_LENGTH, ALIAS_PATTERN, isReservedCode } from '../utils/alias.js';
import { MAX_URL_LENGTH, validateDestinationUrl } from '../utils/validateUrl.js';

// ---------- Reusable fields ----------

const destinationUrl = z
  .string({ required_error: 'Original URL is required.', invalid_type_error: 'Original URL must be text.' })
  .trim()
  .min(1, 'Original URL is required.')
  .max(MAX_URL_LENGTH, `URL must be ${MAX_URL_LENGTH} characters or fewer.`)
  .transform((value, ctx) => {
    const result = validateDestinationUrl(value);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.reason });
      return z.NEVER;
    }
    return result.url;
  });

const alias = z
  .string({ invalid_type_error: 'Alias must be text.' })
  .trim()
  .regex(
    ALIAS_PATTERN,
    `Alias must be ${ALIAS_MIN_LENGTH}-${ALIAS_MAX_LENGTH} characters and use only letters, numbers, hyphens or underscores.`,
  )
  .refine((value) => !isReservedCode(value), 'That alias is reserved. Please choose another one.');

const isoDateTime = z
  .string({ invalid_type_error: 'Expiration must be a date-time string.' })
  .datetime({ offset: true, message: 'Expiration must be a valid ISO 8601 date-time.' })
  .transform((value) => new Date(value));

/** Treats "" and null as "not provided". */
const optionalBlank = (schema) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional());

// ---------- Auth ----------

const email = z
  .string({ required_error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long.')
  .email('Please enter a valid email address.');

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required.' })
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(60, 'Name must be 60 characters or fewer.'),
    email,
    password: z
      .string({ required_error: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must be 72 characters or fewer.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/\d/, 'Password must contain at least one number.'),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.').max(72),
  })
  .strict();

// ---------- URLs ----------

export const createUrlSchema = z
  .object({
    originalUrl: destinationUrl,
    customAlias: optionalBlank(alias),
    expiresAt: optionalBlank(isoDateTime.refine((date) => date.getTime() > Date.now(), 'Expiration date must be in the future.')),
  })
  .strict();

export const updateUrlSchema = z
  .object({
    originalUrl: destinationUrl.optional(),
    shortCode: alias.optional(),
    isActive: z.boolean({ invalid_type_error: 'isActive must be true or false.' }).optional(),
    expiresAt: isoDateTime.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'active', 'inactive', 'expired']).default('all'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid link id.'),
});
