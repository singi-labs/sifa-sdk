import { z } from 'zod';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.course`. */
export const CourseWriteSchema = z.object({
  name: z.string().min(1).max(200),
  number: z.string().max(50).nullable().optional(),
  institution: z.string().max(256).nullable().optional(),
});

export type CourseWriteInput = z.infer<typeof CourseWriteSchema>;
