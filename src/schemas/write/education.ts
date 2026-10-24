import { z } from 'zod';

import { entityRefSchema, partialDateFieldSchema } from './shared.js';

/** Schema enforced by `POST /profile/education` on sifa-api. */
export const EducationWriteSchema = z.object({
  institution: z.string().min(1).max(256),
  entityRef: entityRefSchema,
  degree: z.string().max(256).nullable().optional(),
  fieldOfStudy: z.string().max(256).nullable().optional(),
  eqfLevel: z.number().int().min(1).max(8).nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  activities: z.string().max(1000).nullable().optional(),
  startedAt: partialDateFieldSchema,
  endedAt: partialDateFieldSchema,
});

export type EducationWriteInput = z.infer<typeof EducationWriteSchema>;
