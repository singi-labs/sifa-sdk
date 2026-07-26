import { z } from 'zod';

import { datetimeSchema, maxGraphemes, selfLabelsSchema, uriSchema } from './shared.js';

/**
 * Structured physical address for an organization. Mirrors
 * `community.lexicon.location.address` (all fields optional). Sifa enforces
 * ISO 3166-1 alpha-2 country codes at the app layer.
 */
const orgAddressSchema = z.object({
  country: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  locality: z.string().optional(),
  street: z.string().optional(),
  name: z.string().optional(),
});

/** A featured link on the org profile. Both `name` and `url` are required. */
const orgLinkSchema = z.object({
  name: z.string().refine(maxGraphemes(60)).max(600),
  url: uriSchema.max(2048),
});

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
  /** Physical addresses (headquarters, offices). */
  addresses: z.array(orgAddressSchema).max(10).optional(),
  /**
   * Self-selected headcount range (a declared bucket, never a calculated count).
   * Open enum (bare-string knownValues in the lexicon): `1-10`, `11-50`,
   * `51-200`, `201-500`, `501-1000`, `1001-5000`, `5001-10000`, `10001+`. Any
   * string is accepted so future ranges do not break older records.
   */
  companySize: z.string().optional(),
  /** Featured links or content surfaced on the org profile. */
  links: z.array(orgLinkSchema).max(10).optional(),
  /**
   * Whether the account holder's personal profile stays visible alongside this
   * org profile. For sole traders whose personal domain is also their trade
   * name: one account, two facets, both pages render. Absent or false means the
   * account presents solely as an organization.
   */
  personalProfileVisible: z.boolean().optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type OrgProfileRecord = z.infer<typeof OrgProfileRecordSchema>;
