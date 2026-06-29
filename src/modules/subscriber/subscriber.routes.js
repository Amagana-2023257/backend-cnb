import { Router } from 'express';
import { subscriberController } from './subscriber.controller.js';
import { validate } from '../../middlewares/validate.js';
import { subscribeBody } from './subscriber.validation.js';

/** Ruta pública de suscripción. El listado va en /api/admin/subscribers. */
export const subscriberRoutes = Router();

subscriberRoutes.post('/', validate(subscribeBody, 'body'), subscriberController.subscribe);
