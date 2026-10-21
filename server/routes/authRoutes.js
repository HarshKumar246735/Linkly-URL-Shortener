import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
