/**
 * Modelo Page: define la forma del recurso y mapea documento Firestore → DTO
 * público. SRP: nada de acceso a datos aquí, solo forma y transformación.
 */
export function toPageDTO(doc) {
  const d = doc.data ? doc.data() : doc;
  return {
    id: doc.id ?? String(d.pageid),
    pageid: d.pageid,
    ns: d.ns,
    title: d.title,
    slug: d.slug,
    html: d.html ?? '',
    summary: d.summary ?? '',
    categories: d.categories ?? [],
    redirectTo: d.redirectTo ?? null,
    lastModified: d.lastModified ?? null,
    lastEditor: d.lastEditor ?? null,
    flagged: Boolean(d.flagged),
    spamCategory: d.spamCategory ?? null,
  };
}

/** Versión ligera para listados (sin el HTML completo). */
export function toPageSummary(doc) {
  const dto = toPageDTO(doc);
  // eslint-disable-next-line no-unused-vars
  const { html, ...rest } = dto;
  return rest;
}
