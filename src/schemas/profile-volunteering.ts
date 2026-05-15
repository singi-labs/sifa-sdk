import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes } from './shared.js';

/** Zod schema for `id.sifa.profile.volunteering` records. */
export const ProfileVolunteeringRecordSchema = z.object({
  organization: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  organizationDid: didSchema.optional(),
  role: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  cause: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  startedAt: datetimeSchema.optional(),
  endedAt: datetimeSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileVolunteeringRecord = z.infer<typeof ProfileVolunteeringRecordSchema>;
