import { centrosService } from './centros.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';
import { parsePagination, meta } from '../../utils/pagination.js';

/** Controller: traduce HTTP ↔ service. Sin lógica de negocio. */
export const centrosController = {
  list: asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query, { defLimit: 25, maxLimit: 100 });
    const { ns, q, sort, order } = req.query;
    const { items, total } = centrosService.query({ ns, q, sort, order, limit, offset });
    ok(res, items, meta({ limit, offset, total, count: items.length }));
  }),

  stats: asyncHandler(async (_req, res) => {
    ok(res, centrosService.stats());
  }),
};
