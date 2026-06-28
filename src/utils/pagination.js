/** Normaliza limit/offset desde query. Firestore pagina por offset/cursor. */
export function parsePagination(query, { defLimit = 20, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(Number(query.limit ?? defLimit), 1), maxLimit);
  const offset = Math.max(Number(query.offset ?? 0), 0);
  return { limit, offset };
}

export function meta({ limit, offset, total = undefined, count }) {
  return { limit, offset, count, ...(total !== undefined ? { total } : {}) };
}
