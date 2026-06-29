import { z } from 'zod';

// Tope de offset: Firestore factura una lectura por cada doc SALTADO con
// .offset(), así que un offset gigante (p. ej. 190000) sobre la colección de
// ~199k páginas dispara el costo sin límite. Acotamos la paginación profunda;
// para recorrer TODO el contenido existe /api/sync/bundle (cursor por pageid,
// O(1) por página, sin saltos facturados).
export const MAX_OFFSET = 10000;

export const listPagesQuery = z.object({
  ns: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(MAX_OFFSET).default(0),
});

export const slugParam = z.object({
  slug: z.string().min(1).max(512),
});
