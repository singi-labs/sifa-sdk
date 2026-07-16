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
 * Zod schema for `id.sifa.org.employmentAttestation` records -- an
 * organization's attestation that a person is or was employed in a specific
 * position. Lives in the org's PDS (the org is implicit: whoever owns the repo).
 *
 * The position identity is pinned via a snapshot triple (`title`, `startedAt`,
 * and the entity identifier `entityRef` | `companyDid`) so editing those pinned
 * fields on the referenced position record voids the attestation. The free-text
 * company name is never pinned (a rebrand must not invalidate the attestation).
 *
 * `startedAt` / `endedAt` mirror the position lexicon's freeform `YYYY-MM` /
 * `YYYY-MM-DD` date shape, not strict `datetime`.
 */
export const OrgEmploymentAttestationRecordSchema = z.object({
  subject: didSchema,
  position: strongRefSchema,
  status: z.enum(['current', 'past']),
  title: z.string().min(1).refine(maxGraphemes(256)).max(2560),
  startedAt: partialDateSchema,
  entityRef: uriSchema.optional(),
  companyDid: didSchema.optional(),
  endedAt: partialDateSchema.optional(),
  comment: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type OrgEmploymentAttestationRecord = z.infer<typeof OrgEmploymentAttestationRecordSchema>;
