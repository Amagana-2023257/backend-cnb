import express from 'express';
import { pinoHttp } from 'pino-http';
import { security } from './middlewares/security.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { logger } from './utils/logger.js';

/** Construye la app Express (sin escuchar). Reutilizable por server.js y Vercel. */
export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  security(app);
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use('/api', apiLimiter, apiRouter);
  // Alias directo para health-check de plataformas.
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Raíz: info del servicio (evita un 500 al abrir la URL base).
  app.get('/', (_req, res) =>
    res.json({
      service: 'wiki-cnb-api',
      status: 'ok',
      endpoints: ['/api/health', '/api/pages', '/api/search', '/api/categories', '/api/namespaces', '/api/sync/manifest'],
    }),
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
