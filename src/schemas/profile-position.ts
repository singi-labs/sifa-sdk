import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  selfLabelsSchema,
  strongRefSchema,
} from './shared.js';

/** Zod schema for `id.sifa.profile.position` records. */
export const ProfilePositionRecordSchema = z.object({
  company: z.string().min(1).refine(maxGraphemes(100)).max(1000).optional(),
  companyDid: didSchema.optional(),
  // Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
  // Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
  entityRef: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
    .max(2048)
    .optional(),
  title: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  employmentType: z.string().optional(),
  workplaceType: z.string().optional(),
  location: z.unknown().optional(),
  startedAt: datetimeSchema,
  endedAt: datetimeSchema.optional(),
  skills: z.array(strongRefSchema).max(50).optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfilePositionRecord = z.infer<typeof ProfilePositionRecordSchema>;
