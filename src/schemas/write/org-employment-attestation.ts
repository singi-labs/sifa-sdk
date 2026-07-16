import { z } from 'zod';

import { externalRecordRefSchema } from './shared.js';

/**
 * Schema enforced by the org-employment-attestation write endpoint on sifa-api.
 *
 * An org attests that a Sifa user (`subject`) held a specific `position` record
 * with `title` between `startedAt` and `endedAt` (inclusive of "current" status).
 * The attestation itself is signed by the org's DID; `entityRef` / `companyDid`
 * optionally cross-link the org identifier(s) used at the time.
 */
export const OrgEmploymentAttestationWriteSchema = z.object({
  subject: z.string().regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID'),
  position: externalRecordRefSchema,
  status: z.enum(['current', 'past']),
  title: z.string().min(1).max(2560),
  startedAt: z.string().max(32),
  entityRef: z.string().max(2048).nullable().optional(),
  companyDid: z
    .string()
    .regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID')
    .nullable()
    .optional(),
  endedAt: z.string().max(32).nullable().optional(),
  comment: z.string().max(3000).nullable().optional(),
  createdAt: z.string(),
});

export type OrgEmploymentAttestationWriteInput = z.infer<
  typeof OrgEmploymentAttestationWriteSchema
>;
