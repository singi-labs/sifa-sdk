import { z } from 'zod';

import {
  datetimeSchema,
  maxGraphemes,
  selfLabelsSchema,
  strongRefSchema,
  uriSchema,
} from './shared.js';

/** Zod schema for `id.sifa.profile.project` records. */
export const ProfileProjectRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  url: uriSchema.optional(),
  position: strongRefSchema.optional(),
  // Freeform YYYY-MM or YYYY-MM-DD (not a strict datetime) so partial dates
  // and LinkedIn-importer writes are accepted. See sifa-lexicons#256.
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileProjectRecord = z.infer<typeof ProfileProjectRecordSchema>;
