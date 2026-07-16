import { z } from 'zod';

/**
 * Body accepted by `POST /api/org/claim` (the org claim wizard finalize).
 *
 * Mirrors `claimBodySchema` in sifa-api `src/routes/org-claim.ts` EXACTLY: the
 * editable profile fields plus `entityRefs` (at least one -- a claim without a
 * binding renders but aggregates nothing) and the `authorityAck` checkbox
 * (`literal(true)` -- the logged "I am authorized to represent this org"
 * assertion). `logo`/`createdAt` are NOT part of the claim body (the endpoint
 * sets `createdAt` server-side and the logo is uploaded separately).
 */
export const OrgClaimRequestSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).optional(),
  website: z.string().max(2048).optional(),
  contact: z.string().max(320).optional(),
  entityRefs: z.array(z.string().min(1).max(2048)).min(1).max(20),
  authorityAck: z.literal(true),
});

export type OrgClaimRequestInput = z.infer<typeof OrgClaimRequestSchema>;
