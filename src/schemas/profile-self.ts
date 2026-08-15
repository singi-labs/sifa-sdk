import { z } from 'zod';

import { datetimeSchema, languageTagSchema, maxGraphemes, selfLabelsSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.profile.self` records. Singleton (record key `self`).
 *
 * `knownValues` on `openTo` and `preferredWorkplace` are advisory per the
 * lexicon spec -- unknown values are allowed, but documented options live
 * under the `id.sifa.defs#*` namespace.
 */
export const ProfileSelfRecordSchema = z.object({
  headline: z.string().refine(maxGraphemes(120)).max(1200).optional(),
  about: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  industry: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  givenName: z.string().refine(maxGraphemes(64)).max(640).optional(),
  familyName: z.string().refine(maxGraphemes(64)).max(640).optional(),
  namePronunciation: z.string().refine(maxGraphemes(64)).max(640).optional(),
  location: z.unknown().optional(),
  openTo: z.array(z.string()).max(10).optional(),
  preferredWorkplace: z.array(z.string()).max(3).optional(),
  langs: z.array(languageTagSchema).max(3).optional(),
  labels: selfLabelsSchema.optional(),
  discoverable: z.boolean().optional(),
  createdAt: datetimeSchema,
});

export type ProfileSelfRecord = z.infer<typeof ProfileSelfRecordSchema>;
