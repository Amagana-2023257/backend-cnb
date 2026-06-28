import { pageService } from './page.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';
import { meta } from '../../utils/pagination.js';

/** Controller: traduce HTTP ↔ service. Sin lógica de negocio. */
export const pageController = {
  list: asyncHandler(async (req, res) => {
    const { ns, limit, offset } = req.query;
    const data = await pageService.list({ ns, limit, offset, includeFlagged: false });
    ok(res, data, meta({ limit, offset, count: data.length }));
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const data = await pageService.getBySlug(req.params.slug);
    ok(res, data);
  }),
};
