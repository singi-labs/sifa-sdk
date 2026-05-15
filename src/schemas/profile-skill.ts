import { z } from 'zod';

import { datetimeSchema, maxGraphemes } from './shared.js';

/**
 * Zod schema for `id.sifa.profile.skill` records.
 *
 * `category` is advisory (`knownValues` in the lexicon) -- known values live
 * under `id.sifa.defs#*` but unknown values are accepted.
 */
export const ProfileSkillRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(64)).max(640),
  category: z.string().optional(),
  createdAt: datetimeSchema,
});

export type ProfileSkillRecord = z.infer<typeof ProfileSkillRecordSchema>;
