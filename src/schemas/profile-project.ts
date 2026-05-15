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
  startedAt: datetimeSchema.optional(),
  endedAt: datetimeSchema.optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileProjectRecord = z.infer<typeof ProfileProjectRecordSchema>;
