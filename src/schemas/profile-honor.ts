import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes } from './shared.js';

/** Zod schema for `id.sifa.profile.honor` records. */
export const ProfileHonorRecordSchema = z.object({
  title: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  issuer: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  issuerDid: didSchema.optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  awardedAt: datetimeSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileHonorRecord = z.infer<typeof ProfileHonorRecordSchema>;
