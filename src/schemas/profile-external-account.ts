import { z } from 'zod';

import { datetimeSchema, maxGraphemes, uriSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.profile.externalAccount` records.
 *
 * `platform` is advisory (`knownValues` in the lexicon) -- known values live
 * under `id.sifa.defs#platform*` but unknown values are accepted.
 */
export const ProfileExternalAccountRecordSchema = z.object({
  platform: z.string(),
  url: uriSchema,
  label: z.string().refine(maxGraphemes(64)).max(640).optional(),
  feedUrl: uriSchema.optional(),
  isPrimary: z.boolean().optional(),
  createdAt: datetimeSchema,
});

export type ProfileExternalAccountRecord = z.infer<typeof ProfileExternalAccountRecordSchema>;
