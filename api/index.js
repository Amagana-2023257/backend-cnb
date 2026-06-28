import { createApp } from '../src/app.js';

/**
 * Entry serverless para Vercel. Exporta la app Express como handler;
 * Vercel la invoca por cada request (rewrites en vercel.json).
 */
const app = createApp();
export default app;
