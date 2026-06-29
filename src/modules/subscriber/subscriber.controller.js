import { subscriberService } from './subscriber.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/httpResponse.js';

/** Controller: traduce HTTP ↔ service. Sin lógica de negocio. */
export const subscriberController = {
  // Público: alta de suscriptor.
  subscribe: asyncHandler(async (req, res) => {
    const data = await subscriberService.subscribe(req.body.email);
    created(res, { ...data, message: 'Suscripción registrada' });
  }),

  // Admin: listado.
  list: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const data = await subscriberService.list(limit);
    ok(res, data, { count: data.length });
  }),
};
