import { z } from 'zod';

import { atUriSchema, datetimeSchema, maxGraphemes, strongRefSchema } from './shared.js';

/** Zod schema for `id.sifa.profile.course` records. */
export const ProfileCourseRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  number: z.string().refine(maxGraphemes(50)).max(500).optional(),
  institution: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  // Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
  // Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
  entityRef: z
    .string()
    .url()
    .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
    .max(2048)
    .optional(),
  education: strongRefSchema.optional(),
  // AT-URI of the associated id.sifa.profile.certification record. Plain
  // at-uri (not a strongRef) so the link tracks the live certification.
  credential: atUriSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileCourseRecord = z.infer<typeof ProfileCourseRecordSchema>;
