import { namespaceService } from './namespace.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/httpResponse.js';

/** Controller: traduce HTTP ↔ service. Sin lógica de negocio. */
export const namespaceController = {
  list: asyncHandler(async (_req, res) => {
    ok(res, await namespaceService.list());
  }),

  get: asyncHandler(async (req, res) => {
    ok(res, await namespaceService.getById(req.params.id));
  }),
};
