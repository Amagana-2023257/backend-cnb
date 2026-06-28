/**
 * Modelo Category: forma del recurso y mapeo documento Firestore → DTO.
 * SRP: solo transformación, sin acceso a datos.
 */
export function toCategoryDTO(doc) {
  const d = doc.data ? doc.data() : doc;
  return {
    name: d.name,
    count: d.count ?? null,
  };
}
