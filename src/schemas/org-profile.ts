import { z } from 'zod';

import { datetimeSchema, maxGraphemes, selfLabelsSchema, uriSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.org.profile` records -- the self-declared
 * organization profile. Singleton (record key `self`), lives in the org's PDS.
 * Presence of this record marks the account as presenting as an organization;
 * trust is layered separately (rendering floor, verification labels).
 *
 * Mirrors the lexicon wire shape (grapheme + byte caps, blob logo, uri refs).
 * For the sifa-api write-endpoint contract, use the schemas under
 * `@singi-labs/sifa-sdk/schemas/write` instead.
 */
export const OrgProfileRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  /** Blob ref for the org logo (`image/png` | `image/jpeg`). Not deeply validated client-side. */
  logo: z.unknown().optional(),
  website: uriSchema.optional(),
  entityRefs: z.array(uriSchema).max(20).optional(),
  /** Contact email. NOT rendered publicly; validated as email at the app layer. */
  contact: z.string().optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type OrgProfileRecord = z.infer<typeof OrgProfileRecordSchema>;
