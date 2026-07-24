import { z } from 'zod';

/** Schema enforced by `POST /profile/skills` on sifa-api. */
export const SkillWriteSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
  subCategory: z.string().max(100).optional(),
});

export type SkillWriteInput = z.infer<typeof SkillWriteSchema>;
