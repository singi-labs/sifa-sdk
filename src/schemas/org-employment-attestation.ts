import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
  selfLabelsSchema,
  strongRefSchema,
  uriSchema,
} from './shared.js';

/**
 * Zod schema for `id.sifa.org.employmentAttestation` records (lexicon 0.13):
 * an organization's attestation that a person is or was employed at its
 * entity. Lives in the org's PDS (the org is whoever owns the repo).
 *
 * `position`, `title` and `startedAt` are optional. The org attests
 * employment at the entity, not a job title; the snapshots let a consumer
 * notice a later edit of the position, which makes the attestation stale,
 * never void. `status` and `source` take the `id.sifa.defs` tokens; the bare
 * words are still accepted for records written before the tokens existed.
 * `companyDid` is deprecated (the author is the org) and ignored by readers.
 */
export const OrgEmploymentAttestationRecordSchema = z.object({
  subject: didSchema,
  position: strongRefSchema.optional(),
  status: z.enum([
    'id.sifa.defs#employmentCurrent',
    'id.sifa.defs#employmentPast',
    'current',
    'past',
  ]),
  source: z
    .enum(['id.sifa.defs#attestationManual', 'id.sifa.defs#attestationDirectory'])
    .optional(),
  title: z.string().min(1).refine(maxGraphemes(256)).max(2560).optional(),
  startedAt: partialDateSchema.optional(),
  entityRef: uriSchema.optional(),
  /** @deprecated The author DID is the organization; readers ignore this. */
  companyDid: didSchema.optional(),
  endedAt: partialDateSchema.optional(),
  comment: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type OrgEmploymentAttestationRecord = z.infer<typeof OrgEmploymentAttestationRecordSchema>;
