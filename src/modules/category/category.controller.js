import { categoryService } from './category.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';

/** Controller: traduce HTTP ↔ service. Sin lógica de negocio. */
export const categoryController = {
  list: asyncHandler(async (_req, res) => {
    ok(res, await categoryService.list());
  }),

  pages: asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { limit } = req.query;
    const { category, pages } = await categoryService.pagesOf(name, limit);
    ok(res, pages, { category, count: pages.length });
  }),
};
