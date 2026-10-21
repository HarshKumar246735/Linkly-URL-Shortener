import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createShortUrl,
  deleteOwnedUrl,
  getOwnedUrl,
  listUserUrls,
  serializeUrl,
  updateOwnedUrl,
} from '../services/urlService.js';

export const shorten = asyncHandler(async (req, res) => {
  const { originalUrl, customAlias, expiresAt } = req.validated.body;
  // The owner always comes from the verified session, never from the request body.
  const doc = await createShortUrl({ originalUrl, customAlias, expiresAt, userId: req.user?._id ?? null });
  res.status(201).json({ success: true, data: { url: serializeUrl(doc), isAnonymous: !req.user } });
});

export const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await listUserUrls(req.user._id, req.validated.query);
  res.json({ success: true, data: { urls: items.map(serializeUrl), pagination } });
});

export const getOne = asyncHandler(async (req, res) => {
  const doc = await getOwnedUrl(req.user._id, req.validated.params.id);
  res.json({ success: true, data: { url: serializeUrl(doc) } });
});

export const update = asyncHandler(async (req, res) => {
  const doc = await updateOwnedUrl(req.user._id, req.validated.params.id, req.validated.body);
  res.json({ success: true, data: { url: serializeUrl(doc) } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteOwnedUrl(req.user._id, req.validated.params.id);
  res.status(204).end();
});
