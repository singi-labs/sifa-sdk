import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes, strongRefSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.endorsement` records. Lives in the endorser's PDS;
 * the endorser identity is implicit (whoever owns the repository).
 */
export const EndorsementRecordSchema = z.object({
  subject: didSchema,
  skill: strongRefSchema,
  skillName: z.string().min(1).refine(maxGraphemes(64)).max(640),
  comment: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  createdAt: datetimeSchema,
});

export type EndorsementRecord = z.infer<typeof EndorsementRecordSchema>;
