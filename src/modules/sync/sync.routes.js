import { Router } from 'express';
import { collections } from '../../config/firebaseAdmin.js';
import { toPageSummary } from '../page/page.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';

/**
 * Endpoints para la "descarga de versión offline". El front baja el bundle por
 * lotes (cursor sobre pageid) y lo guarda en IndexedDB (Dexie) + índice FlexSearch.
 */
export const syncRoutes = Router();

// Manifiesto: versión + conteo, para saber si hay que re-sincronizar.
syncRoutes.get(
  '/manifest',
  asyncHandler(async (_req, res) => {
    const metaDoc = await collections.meta.doc('content').get();
    ok(res, metaDoc.exists ? metaDoc.data() : { version: 0, pages: 0 });
  }),
);

// Lote para offline: páginas limpias paginadas por cursor `after` (pageid).
syncRoutes.get(
  '/bundle',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 500), 1000);
    const after = Number(req.query.after ?? 0);
    const snap = await collections.pages
      .where('flagged', '==', false)
      .orderBy('pageid')
      .startAfter(after)
      .limit(limit)
      .get();
    const items = snap.docs.map(toPageSummary);
    const nextCursor = items.length ? items[items.length - 1].pageid : null;
    ok(res, items, { nextCursor, count: items.length });
  }),
);
