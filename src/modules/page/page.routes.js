import { Router } from 'express';
import { pageController } from './page.controller.js';
import { validate } from '../../middlewares/validate.js';
import { listPagesQuery, slugParam } from './page.validation.js';

export const pageRoutes = Router();

pageRoutes.get('/', validate(listPagesQuery, 'query'), pageController.list);
pageRoutes.get('/:slug', validate(slugParam, 'params'), pageController.getBySlug);
