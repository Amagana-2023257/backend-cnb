/**
 * Modelo Namespace: forma del recurso y mapeo documento Firestore → DTO.
 * El doc id es el número de namespace (ns0, ns2, ns6…).
 */
export function toNamespaceDTO(doc) {
  const d = doc.data ? doc.data() : doc;
  return {
    id: Number(d.id ?? doc.id),
    name: d.name,
    count: d.count ?? null,
  };
}
