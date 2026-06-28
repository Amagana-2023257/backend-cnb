import { collections } from '../../config/firebaseAdmin.js';

/** Repository: única capa que conoce Firestore para Namespace (SRP/DIP). */
export const namespaceRepository = {
  async list() {
    // orderBy por el campo numérico `id` (no por el doc id string).
    const snap = await collections.namespaces.orderBy('id').get();
    return snap.docs;
  },

  async findById(id) {
    const doc = await collections.namespaces.doc(String(id)).get();
    return doc.exists ? doc : null;
  },
};
