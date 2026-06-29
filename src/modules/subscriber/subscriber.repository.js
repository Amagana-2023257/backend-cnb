import { collections } from '../../config/firebaseAdmin.js';
import { subscriberId } from './subscriber.model.js';

/** Repository: única capa que conoce Firestore para Subscriber (SRP/DIP). */
export const subscriberRepository = {
  async upsert(email, data) {
    // set + merge → idempotente: re-suscribir el mismo email no duplica.
    await collections.subscribers.doc(subscriberId(email)).set(data, { merge: true });
  },

  async list(limit) {
    const snap = await collections.subscribers.orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs;
  },

  async count() {
    const agg = await collections.subscribers.count().get();
    return agg.data().count;
  },
};
