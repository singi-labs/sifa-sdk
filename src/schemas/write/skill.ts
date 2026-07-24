import { z } from 'zod';

import { maxGraphemes } from '../shared.js';

/** Schema enforced by `POST /profile/skills` on sifa-api. */
export const SkillWriteSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
  // Mirror the record schema bound (id.sifa.profile.skill) so a value that
  // passes here cannot then fail the PDS write. Empty/whitespace-only input is
  // treated as absent so we never persist a meaningless grouping label.
  subCategory: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().refine(maxGraphemes(64)).max(640).optional(),
  ),
});

export type SkillWriteInput = z.infer<typeof SkillWriteSchema>;
