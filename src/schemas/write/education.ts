import { z } from 'zod';

/** Schema enforced by `POST /profile/education` on sifa-api. */
export const EducationWriteSchema = z.object({
  institution: z.string().min(1).max(256),
  degree: z.string().max(256).nullable().optional(),
  fieldOfStudy: z.string().max(256).nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  activities: z.string().max(1000).nullable().optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
});

export type EducationWriteInput = z.infer<typeof EducationWriteSchema>;
