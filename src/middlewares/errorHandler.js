import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

/** Manejador central de errores. Debe ir al final de la cadena. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  if (status >= 500) logger.error({ err, path: req.originalUrl }, 'Error no controlado');

  res.status(status).json({
    error: {
      message: err.expose || status < 500 ? err.message : 'Error interno',
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
