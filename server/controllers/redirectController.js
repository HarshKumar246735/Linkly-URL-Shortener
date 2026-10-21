import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidCodeFormat } from '../utils/alias.js';
import { isSafeRedirectTarget } from '../utils/validateUrl.js';
import { resolveShortCode } from '../services/urlService.js';

/**
 * GET /:code
 * Uses 302 (temporary) so that edits to a link's destination, deactivation and expiry take effect
 * immediately instead of being cached by browsers. No analytics or click data is recorded.
 */
export const redirectToDestination = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const notFound = new ApiError(404, 'This short link does not exist. Please check the address and try again.', {
    code: 'LINK_NOT_FOUND',
  });

  if (!isValidCodeFormat(code)) throw notFound;

  const result = await resolveShortCode(code);
  if (result.state === 'not_found') throw notFound;
  if (result.state === 'inactive') {
    throw new ApiError(410, 'This link has been disabled by its owner.', { code: 'LINK_INACTIVE' });
  }
  if (result.state === 'expired') {
    throw new ApiError(410, 'This link has expired and no longer redirects.', { code: 'LINK_EXPIRED' });
  }

  // Defence in depth: stored data is validated on write, but never redirect to a non-http(s) target.
  if (!isSafeRedirectTarget(result.destination)) throw notFound;

  res.set('Cache-Control', 'no-store');
  res.redirect(302, result.destination);
});
