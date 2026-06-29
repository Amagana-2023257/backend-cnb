import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { config } from './env.js';

/**
 * Inicializa Firebase Admin una sola vez (singleton).
 * - En Vercel: credenciales desde FIREBASE_SERVICE_ACCOUNT (JSON en env).
 * - En local: GOOGLE_APPLICATION_CREDENTIALS (ruta a archivo).
 * Es el ÚNICO módulo con acceso privilegiado a Firestore (DIP: los
 * repositorios reciben `db` desde aquí, no lo crean).
 */
function buildCredential() {
  if (config.firebase.serviceAccountJson) {
    return cert(JSON.parse(config.firebase.serviceAccountJson));
  }
  // applicationDefault() usa GOOGLE_APPLICATION_CREDENTIALS automáticamente.
  return applicationDefault();
}

if (!getApps().length) {
  initializeApp({
    credential: buildCredential(),
    projectId: config.firebase.projectId,
  });
}

export const db = getFirestore();
export const auth = getAuth();

// Colecciones (centralizadas para evitar strings mágicos dispersos).
export const collections = {
  pages: db.collection('pages'),
  categories: db.collection('categories'),
  namespaces: db.collection('namespaces'),
  meta: db.collection('meta'),
  subscribers: db.collection('subscribers'),
};
