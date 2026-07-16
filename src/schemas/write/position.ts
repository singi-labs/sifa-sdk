import { z } from 'zod';

import { entityRefSchema, skillRefSchema, writeLocationSchema } from './shared.js';

/**
 * Schema enforced by `POST /profile/positions` on sifa-api.
 *
 * Client-side callers can `.safeParse(...)` this before submitting to catch
 * obvious problems (empty `title`, over-length text) before the network
 * round-trip. If it passes here, the API will accept the write modulo
 * transport / auth failures.
 *
 * `company` is optional to support freelancer / independent employment types
 * where the position has no employer. This matches sifa-api's current
 * behavior in `src/routes/schemas.ts` and the SDK's lexicon schema
 * (`ProfilePositionRecordSchema`) since sifa-sdk #184.
 */
export const PositionWriteSchema = z.object({
  company: z.string().min(1).max(256).nullable().optional(),
  entityRef: entityRefSchema,
  title: z.string().min(1).max(256),
  description: z.string().max(50000).nullable().optional(),
  employmentType: z.string().nullable().optional(),
  workplaceType: z.string().nullable().optional(),
  location: writeLocationSchema,
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  skills: z.array(skillRefSchema).max(50).nullable().optional(),
});

export type PositionWriteInput = z.infer<typeof PositionWriteSchema>;
