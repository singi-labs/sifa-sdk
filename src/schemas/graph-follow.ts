import { z } from 'zod';

import { datetimeSchema, didSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.graph.follow` records.
 * One-way professional follow; lives in the follower's PDS.
 */
export const GraphFollowRecordSchema = z.object({
  subject: didSchema,
  createdAt: datetimeSchema,
});

export type GraphFollowRecord = z.infer<typeof GraphFollowRecordSchema>;
