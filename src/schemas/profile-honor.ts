import { z } from 'zod';

import { ArtifactLinkSchema } from './profile-involvement.js';
import { datetimeSchema, didSchema, maxGraphemes, partialDateSchema } from './shared.js';

/** Zod schema for `id.sifa.profile.honor` records. */
export const ProfileHonorRecordSchema = z.object({
  title: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  issuer: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  issuerDid: didSchema.optional(),
  // Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
  // Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
  entityRef: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
    .max(2048)
    .optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  awardedAt: partialDateSchema.optional(),
  // Open set: the id.sifa.defs#honor* tokens are known, other tokens pass.
  kind: z.string().optional(),
  links: z.array(ArtifactLinkSchema).max(50).optional(),
  createdAt: datetimeSchema,
});

export type ProfileHonorRecord = z.infer<typeof ProfileHonorRecordSchema>;
