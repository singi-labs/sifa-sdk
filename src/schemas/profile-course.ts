import { z } from 'zod';

import { datetimeSchema, maxGraphemes, strongRefSchema } from './shared.js';

/** Zod schema for `id.sifa.profile.course` records. */
export const ProfileCourseRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  number: z.string().refine(maxGraphemes(50)).max(500).optional(),
  institution: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  education: strongRefSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileCourseRecord = z.infer<typeof ProfileCourseRecordSchema>;
