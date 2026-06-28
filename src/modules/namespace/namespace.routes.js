import { Router } from 'express';
import { namespaceController } from './namespace.controller.js';
import { validate } from '../../middlewares/validate.js';
import { namespaceIdParam } from './namespace.validation.js';

export const namespaceRoutes = Router();

namespaceRoutes.get('/', namespaceController.list);
namespaceRoutes.get('/:id', validate(namespaceIdParam, 'params'), namespaceController.get);
