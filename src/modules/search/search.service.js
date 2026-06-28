import { collections } from '../../config/firebaseAdmin.js';
import { toPageSummary } from '../page/page.model.js';

/** Tokeniza una consulta del mismo modo que la ingesta indexa `tokens[]`. */
export function tokenize(text) {
  return Array.from(
    new Set(
      (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length >= 3),
    ),
  ).slice(0, 10);
}

/**
 * Búsqueda básica sobre Firestore: array-contains-any sobre `tokens[]`.
 * NOTA: Firestore no es un motor full-text. Para offline y mejor relevancia,
 * el front usa FlexSearch sobre el contenido descargado.
 */
export const searchService = {
  async search(q, limit = 20) {
    const tokens = tokenize(q);
    if (tokens.length === 0) return [];
    const snap = await collections.pages
      .where('flagged', '==', false)
      .where('tokens', 'array-contains-any', tokens)
      .limit(limit)
      .get();
    return snap.docs.map(toPageSummary);
  },
};
