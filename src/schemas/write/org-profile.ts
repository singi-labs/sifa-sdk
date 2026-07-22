import { z } from 'zod';

/**
 * Schema enforced by the org-profile write endpoint on sifa-api.
 *
 * Sifa-managed org identity: name + description + contact channel plus
 * `entityRefs` linking the org to portable identifiers (Wikidata / ROR /
 * LEI / sifa.id URI, http(s) enforced elsewhere).
 */
/** Structured physical address (community.lexicon.location.address; all fields optional). */
const orgAddressWriteSchema = z.object({
  country: z.string().max(10).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  region: z.string().max(1000).nullable().optional(),
  locality: z.string().max(1000).nullable().optional(),
  street: z.string().max(2000).nullable().optional(),
  name: z.string().max(1000).nullable().optional(),
});

/** A featured link (both `name` and `url` required). */
const orgLinkWriteSchema = z.object({
  name: z.string().min(1).max(600),
  url: z.string().max(2048),
});

export const OrgProfileWriteSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).nullable().optional(),
  logo: z.unknown().nullable().optional(),
  website: z.string().max(2048).nullable().optional(),
  entityRefs: z.array(z.string().max(2048)).max(20).nullable().optional(),
  contact: z.string().max(320).nullable().optional(),
  addresses: z.array(orgAddressWriteSchema).max(10).nullable().optional(),
  companySize: z.string().max(20).nullable().optional(),
  links: z.array(orgLinkWriteSchema).max(10).nullable().optional(),
  createdAt: z.string(),
});

export type OrgProfileWriteInput = z.infer<typeof OrgProfileWriteSchema>;
