import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from '../config/env.js';

/** Cabeceras de seguridad, CORS restringido y compresión. */
export function security(app) {
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin(origin, cb) {
        // Permite herramientas sin origin (curl) y los dominios del allowlist.
        if (!origin || config.corsOrigins.includes(origin.toLowerCase())) {
          return cb(null, true);
        }
        return cb(new Error(`Origen no permitido por CORS: ${origin}`));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
}
