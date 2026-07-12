import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes, partialDateSchema } from './shared.js';

/** Zod schema for `id.sifa.profile.volunteering` records. */
export const ProfileVolunteeringRecordSchema = z.object({
  organization: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  organizationDid: didSchema.optional(),
  // Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
  // Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
  entityRef: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
    .max(2048)
    .optional(),
  role: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  cause: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  startedAt: partialDateSchema.optional(),
  endedAt: partialDateSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileVolunteeringRecord = z.infer<typeof ProfileVolunteeringRecordSchema>;
