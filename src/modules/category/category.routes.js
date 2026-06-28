import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validate } from '../../middlewares/validate.js';
import { categoryNameParam, categoryPagesQuery } from './category.validation.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', categoryController.list);
categoryRoutes.get(
  '/:name/pages',
  validate(categoryNameParam, 'params'),
  validate(categoryPagesQuery, 'query'),
  categoryController.pages,
);
