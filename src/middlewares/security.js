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
        // Para un origen no permitido NO lanzamos error (evita 500): simplemente
        // no se añaden los headers CORS y el navegador lo bloquea limpiamente.
        const allowed = !origin || config.corsOrigins.includes(origin.toLowerCase());
        cb(null, allowed);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
}
