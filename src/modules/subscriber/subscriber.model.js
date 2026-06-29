/**
 * Modelo Subscriber: forma del recurso y mapeo documento Firestore → DTO.
 * El doc id es el email codificado (idempotente: un email = un suscriptor).
 */
export function toSubscriberDTO(doc) {
  const d = doc.data ? doc.data() : doc;
  return {
    email: d.email,
    createdAt: d.createdAt ?? null,
    source: d.source ?? null,
  };
}

/** id de documento estable y seguro para Firestore a partir del email. */
export function subscriberId(email) {
  return encodeURIComponent(email.trim().toLowerCase());
}
