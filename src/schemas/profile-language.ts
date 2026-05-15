import { z } from 'zod';

import { datetimeSchema, maxGraphemes } from './shared.js';

/**
 * Zod schema for `id.sifa.profile.language` records.
 *
 * `proficiency` is advisory (`knownValues` in the lexicon) -- known values
 * are the five-level LinkedIn-compatible scale under `id.sifa.defs#*`.
 */
export const ProfileLanguageRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(64)).max(640),
  proficiency: z.string().optional(),
  createdAt: datetimeSchema,
});

export type ProfileLanguageRecord = z.infer<typeof ProfileLanguageRecordSchema>;
