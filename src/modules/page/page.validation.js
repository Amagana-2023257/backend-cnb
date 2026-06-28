import { z } from 'zod';

export const listPagesQuery = z.object({
  ns: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const slugParam = z.object({
  slug: z.string().min(1).max(512),
});
