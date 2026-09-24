import { z } from 'zod';

/**
 * Schema enforced by the org-profile write endpoint on sifa-api.
 *
 * Sifa-managed org identity: name + description + contact channel plus
 * `entityRefs` linking the org to portable identifiers (Wikidata / ROR /
 * LEI / sifa.id URI, http(s) enforced elsewhere).
 */
/**
 * Structured physical address (community.lexicon.location.address; all fields
 * optional). Field caps mirror `orgAddressSchema` in sifa-api
 * `src/routes/org-settings.ts` exactly; country is free text (not ISO-gated at
 * this layer).
 */
const orgAddressWriteSchema = z.object({
  country: z.string().max(255).nullable().optional(),
  postalCode: z.string().max(64).nullable().optional(),
  region: z.string().max(255).nullable().optional(),
  locality: z.string().max(255).nullable().optional(),
  street: z.string().max(2048).nullable().optional(),
  name: z.string().max(255).nullable().optional(),
});

/**
 * A featured link (both `name` and `url` required). Mirrors `orgLinkSchema` in
 * sifa-api: the url MUST be http(s) -- DOMPurify does not strip a
 * `javascript:`/`data:` scheme from a bare string, so the scheme is rejected
 * here to prevent stored XSS.
 */
const orgLinkWriteSchema = z.object({
  name: z.string().min(1).max(255),
  url: z
    .string()
    .max(2048)
    .refine(
      (u) => {
        try {
          const { protocol } = new URL(u);
          return protocol === 'http:' || protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Only http(s) URLs are allowed' },
    ),
});

export const OrgProfileWriteSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).nullable().optional(),
  logo: z.unknown().nullable().optional(),
  website: z.string().max(2048).nullable().optional(),
  entityRefs: z.array(z.string().max(2048)).max(20).nullable().optional(),
  contact: z.string().max(320).nullable().optional(),
  // Array caps stay at 10 (the sifa-web owner-editor limit) by design, even
  // though the sifa-api endpoint tolerates 20. Field caps below mirror the API.
  addresses: z.array(orgAddressWriteSchema).max(10).nullable().optional(),
  companySize: z.string().max(64).nullable().optional(),
  companyType: z.string().max(64).nullable().optional(),
  links: z.array(orgLinkWriteSchema).max(10).nullable().optional(),
  // Self-declared narrative fields; registry facts (LEI, registration number,
  // legal form, ticker) stay internal and are never self-declared.
  industries: z
    .array(
      z.object({
        industry: z.string().max(100),
        domain: z.string().max(100).nullable().optional(),
      }),
    )
    .max(10)
    .nullable()
    .optional(),
  founded: z.string().max(10).nullable().optional(),
  aliases: z.array(z.string().max(200)).max(20).nullable().optional(),
  personalProfileVisible: z.boolean().nullable().optional(),
  createdAt: z.string(),
});

export type OrgProfileWriteInput = z.infer<typeof OrgProfileWriteSchema>;
