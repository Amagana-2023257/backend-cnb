import { auth } from '../config/firebaseAdmin.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Verifica el ID token de Firebase (email/contraseña) que el front envía en
 * `Authorization: Bearer <token>` y lo deja en req.user.
 */
async function verifyToken(req) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Falta el token Bearer');
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: (decoded.email ?? '').toLowerCase() };
  } catch {
    throw ApiError.unauthorized('Token inválido o expirado');
  }
}

/** Exige sesión válida (cualquier usuario autenticado). */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  req.user = await verifyToken(req);
  next();
});

/** Exige sesión válida Y que el email esté en el allowlist de admins. */
export const requireAdmin = asyncHandler(async (req, _res, next) => {
  req.user = await verifyToken(req);
  if (!config.adminEmails.includes(req.user.email)) {
    throw ApiError.forbidden('Esta cuenta no es administradora');
  }
  next();
});
