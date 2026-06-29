import { z } from 'zod';

export const subscribeBody = z.object({
  email: z.string().email().max(254),
});
