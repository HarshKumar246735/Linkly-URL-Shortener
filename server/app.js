import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { redirectToDestination } from './controllers/redirectController.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { apiLimiter, redirectLimiter } from './middleware/rateLimitMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy); // Render terminates TLS in front of the app

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ---------- API ----------
const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header: same-origin requests, curl, server-to-server.
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'This origin is not allowed.', { code: 'CORS_FORBIDDEN' }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  maxAge: 600,
});

app.use('/api', corsMiddleware, csrfProtection, apiLimiter);

app.get('/api/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    data: {
      status: databaseConnected ? 'ok' : 'degraded',
      database: databaseConnected ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api', notFoundHandler); // unknown /api/* paths -> JSON 404

// ---------- Public redirect (must stay AFTER the API routes) ----------
app.get('/', (_req, res) => res.redirect(302, config.clientOrigins[0]));
app.get('/:code', redirectLimiter, redirectToDestination);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
