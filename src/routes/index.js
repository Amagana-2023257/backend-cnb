import { Router } from 'express';
import { pageRoutes } from '../modules/page/page.routes.js';
import { searchRoutes } from '../modules/search/search.routes.js';
import { categoryRoutes } from '../modules/category/category.routes.js';
import { namespaceRoutes } from '../modules/namespace/namespace.routes.js';
import { syncRoutes } from '../modules/sync/sync.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';

/** Monta todas las rutas de módulos bajo /api. */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
apiRouter.use('/pages', pageRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/namespaces', namespaceRoutes);
apiRouter.use('/sync', syncRoutes);
apiRouter.use('/admin', adminRoutes);
