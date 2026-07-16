import { z } from 'zod';

import { entityRefSchema } from './shared.js';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.honor`. */
export const HonorWriteSchema = z.object({
  title: z.string().min(1).max(200),
  issuer: z.string().max(256).nullable().optional(),
  entityRef: entityRefSchema,
  description: z.string().max(50000).nullable().optional(),
  awardedAt: z.string().nullable().optional(),
});

export type HonorWriteInput = z.infer<typeof HonorWriteSchema>;
