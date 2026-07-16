import { z } from 'zod';

import { skillRefSchema, writeLocationSchema } from './shared.js';

/**
 * Schema enforced by `POST /profile/positions` on sifa-api.
 *
 * Client-side callers can `.safeParse(...)` this before submitting to catch
 * obvious problems (empty `title`, over-length text) before the network
 * round-trip. If it passes here, the API will accept the write modulo
 * transport / auth failures.
 *
 * `company` is intentionally optional to support freelancer / independent
 * employment types where the position has no employer. The current
 * `sifa-api/src/routes/schemas.ts` requires `company` (`.min(1)`); the
 * sifa-api adoption PR that consumes this schema will therefore be a
 * behavior change that unblocks the freelancer flow. The SDK's lexicon
 * schema (`ProfilePositionRecordSchema`) has treated `company` as optional
 * since sifa-sdk #184.
 */
export const PositionWriteSchema = z.object({
  company: z.string().min(1).max(256).nullable().optional(),
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
