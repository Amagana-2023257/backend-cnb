import { collections } from '../../config/firebaseAdmin.js';

/**
 * Repository: ÚNICA capa que conoce Firestore para Page (SRP/DIP).
 * El service depende de esta interfaz, no de Firestore directamente.
 */
export const pageRepository = {
  async findBySlug(slug) {
    const snap = await collections.pages.where('slug', '==', slug).limit(1).get();
    return snap.empty ? null : snap.docs[0];
  },

  async findById(pageid) {
    const doc = await collections.pages.doc(String(pageid)).get();
    return doc.exists ? doc : null;
  },

  async list({ ns, limit, offset, includeFlagged }) {
    let q = collections.pages.orderBy('title');
    if (ns !== undefined) q = q.where('ns', '==', ns);
    if (!includeFlagged) q = q.where('flagged', '==', false);
    // offset es simple; para escala grande conviene cursor (startAfter).
    const snap = await q.offset(offset).limit(limit).get();
    return snap.docs;
  },

  async save(pageid, data) {
    await collections.pages.doc(String(pageid)).set(data, { merge: true });
  },
};
