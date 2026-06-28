import 'dotenv/config';

/**
 * Configuración centralizada y validada. Único punto que lee process.env
 * (SRP). El resto del backend importa `config` desde aquí.
 */
function required(name, fallback = undefined) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }
  return v;
}

function list(name, fallback = '') {
  return (process.env[name] ?? fallback)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: list('CORS_ORIGIN', 'http://localhost:5173'),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT, // prod (Vercel)
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS, // local
  },
  adminEmails: list('ADMIN_EMAILS'),
  ingest: {
    jsonlPath: process.env.JSONL_PATH ?? '../../cn_control2/contenido_paginas.jsonl',
    hallazgosPath: process.env.HALLAZGOS_PATH,
    batchSize: Math.min(Number(process.env.INGEST_BATCH_SIZE ?? 500), 500),
  },
  isProd: process.env.NODE_ENV === 'production',
};

export { required };
