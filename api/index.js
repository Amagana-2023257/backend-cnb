import { createApp } from '../src/app.js';

/**
 * Entry serverless para Vercel. En vez de exportar la app Express directamente,
 * la envolvemos en un handler con try/catch: si la invocación lanza de forma
 * sincrónica, respondemos 500 limpio en lugar de FUNCTION_INVOCATION_FAILED.
 */
const app = createApp();

export default function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'handler error', detail: String(err && err.message) } }));
  }
}
