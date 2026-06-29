import { subscriberRepository } from './subscriber.repository.js';
import { toSubscriberDTO } from './subscriber.model.js';

/** Service: reglas de negocio de Subscriber. Sin HTTP ni Firestore directo. */
export const subscriberService = {
  async subscribe(email, source = 'web') {
    const normalized = email.trim().toLowerCase();
    await subscriberRepository.upsert(normalized, {
      email: normalized,
      source,
      createdAt: new Date().toISOString(),
    });
    return { email: normalized };
  },

  async list(limit = 100) {
    const docs = await subscriberRepository.list(limit);
    return docs.map(toSubscriberDTO);
  },

  count: () => subscriberRepository.count(),
};
