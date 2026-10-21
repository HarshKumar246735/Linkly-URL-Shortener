import { Router } from 'express';
import { getOne, list, remove, shorten, update } from '../controllers/urlController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { anonymousShortenLimiter, authenticatedShortenLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { createUrlSchema, idParamSchema, listQuerySchema, updateUrlSchema } from '../validators/schemas.js';

const router = Router();

// Public: works for visitors and logged-in users (links are attached to the user when logged in).
router.post('/shorten', optionalAuth, anonymousShortenLimiter, authenticatedShortenLimiter, validate(createUrlSchema), shorten);

// Everything below requires a verified session and is scoped to the owner.
router.use(requireAuth);
router.get('/', validate(listQuerySchema, 'query'), list);
router.get('/:id', validate(idParamSchema, 'params'), getOne);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUrlSchema), update);
router.delete('/:id', validate(idParamSchema, 'params'), remove);

export default router;
