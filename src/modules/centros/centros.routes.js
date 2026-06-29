import { Router } from 'express';
import { centrosController } from './centros.controller.js';

/** Rutas públicas de monitoreo de centros (registros del CNB). */
export const centrosRoutes = Router();

centrosRoutes.get('/', centrosController.list);
centrosRoutes.get('/stats', centrosController.stats);
