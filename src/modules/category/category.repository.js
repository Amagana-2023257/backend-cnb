import { collections } from '../../config/firebaseAdmin.js';

/**
 * Repository: única capa que conoce Firestore para Category (SRP/DIP).
 * Devuelve documentos crudos; el service los mapea con el modelo.
 */
export const categoryRepository = {
  async list() {
    const snap = await collections.categories.orderBy('name').get();
    return snap.docs;
  },

  async findByName(name) {
    const snap = await collections.categories.where('name', '==', name).limit(1).get();
    return snap.empty ? null : snap.docs[0];
  },

  async pagesOf(name, limit) {
    const snap = await collections.pages
      .where('flagged', '==', false)
      .where('categories', 'array-contains', name)
      .limit(limit)
      .get();
    return snap.docs;
  },
};
