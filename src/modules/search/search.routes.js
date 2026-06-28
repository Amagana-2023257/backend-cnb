import { Router } from 'express';
import { searchController, searchQuery } from './search.controller.js';
import { validate } from '../../middlewares/validate.js';

export const searchRoutes = Router();
searchRoutes.get('/', validate(searchQuery, 'query'), searchController.search);
