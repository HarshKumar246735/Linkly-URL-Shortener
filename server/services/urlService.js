import { config } from '../config/env.js';
import { Url } from '../models/Url.js';
import { ApiError } from '../utils/ApiError.js';
import { isReservedCode } from '../utils/alias.js';
import { generateShortCode } from '../utils/generateShortCode.js';

const MAX_CODE_ATTEMPTS = 5;

export const buildShortUrl = (code) => `${config.baseUrl}/${code}`;

export function getStatus(doc, now = new Date()) {
  if (!doc.isActive) return 'inactive';
  if (doc.expiresAt && doc.expiresAt <= now) return 'expired';
  return 'active';
}

export function serializeUrl(doc) {
  return {
    id: String(doc._id),
    originalUrl: doc.originalUrl,
    shortCode: doc.shortCode,
    shortUrl: buildShortUrl(doc.shortCode),
    isActive: doc.isActive,
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    status: getStatus(doc),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

const isDuplicateShortCode = (error) =>
  error?.code === 11000 && (Boolean(error.keyPattern?.shortCode) || /shortCode/.test(error.message || ''));

const aliasTakenError = () =>
  new ApiError(409, 'That alias is already taken. Please choose another one.', { code: 'ALIAS_TAKEN' });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Creates a short link. Uniqueness is guaranteed by the unique index on shortCode:
 * we attempt the insert and react to the duplicate-key error rather than check-then-insert.
 */
export async function createShortUrl({ originalUrl, customAlias, expiresAt, userId }) {
  const base = { originalUrl, expiresAt: expiresAt ?? null, userId: userId ?? null };

  if (customAlias) {
    try {
      return await Url.create({ ...base, shortCode: customAlias });
    } catch (error) {
      if (isDuplicateShortCode(error)) throw aliasTakenError();
      throw error;
    }
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const shortCode = generateShortCode();
    if (isReservedCode(shortCode)) continue;
    try {
      return await Url.create({ ...base, shortCode });
    } catch (error) {
      if (!isDuplicateShortCode(error)) throw error; // collision: retry with a new code
    }
  }
  throw new ApiError(503, 'Could not generate a unique short code. Please try again.', { code: 'CODE_GENERATION_FAILED' });
}

export async function listUserUrls(userId, { page, limit, search, status }) {
  const now = new Date();
  const and = [];

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: [{ originalUrl: pattern }, { shortCode: pattern }] });
  }
  if (status === 'active') and.push({ isActive: true }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  if (status === 'inactive') and.push({ isActive: false });
  if (status === 'expired') and.push({ isActive: true, expiresAt: { $lte: now } });

  const filter = { userId, ...(and.length ? { $and: and } : {}) };

  const [items, total] = await Promise.all([
    Url.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Url.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Looks up a link by id AND owner. Other users' links are reported as "not found". */
export async function getOwnedUrl(userId, id) {
  const doc = await Url.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(404, 'Link not found.', { code: 'LINK_NOT_FOUND' });
  return doc;
}

export async function updateOwnedUrl(userId, id, patch) {
  const doc = await getOwnedUrl(userId, id);
  const now = new Date();

  if (patch.originalUrl !== undefined) doc.originalUrl = patch.originalUrl;
  if (patch.shortCode !== undefined) doc.shortCode = patch.shortCode;

  if (patch.expiresAt !== undefined) {
    const unchanged = patch.expiresAt && doc.expiresAt && patch.expiresAt.getTime() === doc.expiresAt.getTime();
    if (patch.expiresAt !== null && patch.expiresAt <= now && !unchanged) {
      throw new ApiError(422, 'Expiration date must be in the future.', {
        code: 'VALIDATION_ERROR',
        details: [{ field: 'expiresAt', message: 'Expiration date must be in the future.' }],
      });
    }
    doc.expiresAt = patch.expiresAt;
  }

  if (patch.isActive !== undefined) {
    if (patch.isActive === true && doc.expiresAt && doc.expiresAt <= now) {
      throw new ApiError(422, 'This link has expired. Set a new expiration date or remove it before reactivating.', {
        code: 'LINK_EXPIRED',
      });
    }
    doc.isActive = patch.isActive;
  }

  try {
    await doc.save();
  } catch (error) {
    if (isDuplicateShortCode(error)) throw aliasTakenError();
    throw error;
  }
  return doc;
}

export async function deleteOwnedUrl(userId, id) {
  const result = await Url.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) throw new ApiError(404, 'Link not found.', { code: 'LINK_NOT_FOUND' });
}

/** Resolves a public short code to a redirect decision. */
export async function resolveShortCode(code) {
  const doc = await Url.findOne({ shortCode: code }).lean();
  if (!doc) return { state: 'not_found' };
  if (!doc.isActive) return { state: 'inactive' };
  if (doc.expiresAt && doc.expiresAt <= new Date()) return { state: 'expired' };
  return { state: 'ok', destination: doc.originalUrl };
}
