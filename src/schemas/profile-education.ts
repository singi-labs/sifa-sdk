import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
  selfLabelsSchema,
} from './shared.js';

/** Zod schema for `id.sifa.profile.education` records. */
export const ProfileEducationRecordSchema = z.object({
  institution: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  institutionDid: didSchema.optional(),
  // Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
  // Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
  entityRef: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
    .max(2048)
    .optional(),
  degree: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  fieldOfStudy: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  grade: z.string().refine(maxGraphemes(50)).max(500).optional(),
  activities: z.string().refine(maxGraphemes(1000)).max(10000).optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  location: z.unknown().optional(),
  startedAt: partialDateSchema.optional(),
  endedAt: partialDateSchema.optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileEducationRecord = z.infer<typeof ProfileEducationRecordSchema>;
