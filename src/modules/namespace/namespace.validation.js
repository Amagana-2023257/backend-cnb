import { z } from 'zod';

export const namespaceIdParam = z.object({
  id: z.coerce.number().int(),
});
