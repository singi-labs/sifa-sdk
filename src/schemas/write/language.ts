import { z } from 'zod';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.language`. */
export const LanguageWriteSchema = z.object({
  name: z.string().min(1).max(64),
  proficiency: z.string().max(50).optional(),
});

export type LanguageWriteInput = z.infer<typeof LanguageWriteSchema>;
