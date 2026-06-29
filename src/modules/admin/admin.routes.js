import { Router } from 'express';
import { z } from 'zod';
import { collections } from '../../config/firebaseAdmin.js';
import { pageRepository } from '../page/page.repository.js';
import { toPageDTO } from '../page/page.model.js';
import { subscriberController } from '../subscriber/subscriber.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { adminLimiter } from '../../middlewares/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';

/**
 * Panel de administración: TODO requiere requireAdmin (email en allowlist).
 * Aquí el admin revisa spam y edita/oculta artículos.
 */
export const adminRoutes = Router();
adminRoutes.use(adminLimiter, requireAdmin);

// Quién soy (el front lo usa para mostrar/ocultar el panel).
adminRoutes.get(
  '/me',
  asyncHandler(async (req, res) => ok(res, { ...req.user, isAdmin: true })),
);

// Listado de suscriptores (solo admin).
adminRoutes.get('/subscribers', subscriberController.list);

// Listar artículos marcados como spam para revisión humana.
adminRoutes.get(
  '/flagged',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const snap = await collections.pages
      .where('flagged', '==', true)
      .limit(limit)
      .get();
    ok(res, snap.docs.map(toPageDTO));
  }),
);

// Editar campos editables de un artículo (html/summary/flagged).
const patchSchema = z.object({
  html: z.string().optional(),
  summary: z.string().optional(),
  flagged: z.boolean().optional(),
});

adminRoutes.put(
  '/pages/:pageid',
  validate(patchSchema, 'body'),
  asyncHandler(async (req, res) => {
    await pageRepository.save(req.params.pageid, {
      ...req.body,
      editedBy: req.user.email,
      editedAt: new Date().toISOString(),
    });
    const doc = await pageRepository.findById(req.params.pageid);
    ok(res, toPageDTO(doc));
  }),
);
