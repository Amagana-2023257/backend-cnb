/** Forma estándar de respuesta: { data, meta }. */
export const ok = (res, data, meta = undefined) =>
  res.json(meta ? { data, meta } : { data });

export const created = (res, data) => res.status(201).json({ data });
