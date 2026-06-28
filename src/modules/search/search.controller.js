import { z } from 'zod';
import { searchService } from './search.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';

export const searchQuery = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchController = {
  search: asyncHandler(async (req, res) => {
    const { q, limit } = req.query;
    const data = await searchService.search(q, limit);
    ok(res, data, { query: q, count: data.length });
  }),
};
