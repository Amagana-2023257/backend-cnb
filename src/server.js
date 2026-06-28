import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

/** Arranque para desarrollo local (Vercel usa api/index.js). */
const app = createApp();
app.listen(config.port, () => {
  logger.info(`API escuchando en http://localhost:${config.port}`);
});
