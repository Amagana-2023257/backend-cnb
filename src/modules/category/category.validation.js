import { z } from 'zod';

export const categoryNameParam = z.object({
  name: z.string().min(1).max(256),
});

export const categoryPagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
