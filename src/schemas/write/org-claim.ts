import { z } from 'zod';

/** Structured physical address (all fields optional). Mirrors sifa-api's
 * `orgAddressSchema`; country is free text, not ISO-gated at this layer. */
const orgAddressSchema = z.object({
  country: z.string().max(255).optional(),
  postalCode: z.string().max(64).optional(),
  region: z.string().max(255).optional(),
  locality: z.string().max(255).optional(),
  street: z.string().max(2048).optional(),
  name: z.string().max(255).optional(),
});

/** A featured link (name + url). The url MUST be http(s) to prevent a
 * `javascript:`/`data:` scheme reaching a stored value. */
const orgLinkSchema = z.object({
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

/** A self-declared industry/domain pair (`industry` required token). */
const orgIndustrySchema = z.object({
  industry: z.string().min(1).max(100),
  domain: z.string().max(100).optional(),
});

/** Founding date: a year (YYYY), month (YYYY-MM), or full date (YYYY-MM-DD). */
const orgFoundedSchema = z
  .string()
  .max(10)
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, {
    message: 'Must be a year (YYYY), month (YYYY-MM), or date (YYYY-MM-DD)',
  });

/**
 * Body accepted by `POST /api/org/claim` (the org claim wizard finalize).
 *
 * Mirrors `claimBodySchema` in sifa-api `src/routes/org-claim.ts` EXACTLY: the
 * editable profile fields plus `entityRefs` (at least one -- a claim without a
 * binding renders but aggregates nothing) and the `authorityAck` checkbox
 * (`literal(true)` -- the logged "I am authorized to represent this org"
 * assertion). `logo`/`createdAt` are NOT part of the claim body (the endpoint
 * sets `createdAt` server-side and the logo is uploaded separately). The
 * self-declared profile fields let the claim wizard seed a company's PDS record
 * from firmographics at claim time.
 */
export const OrgClaimRequestSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).optional(),
  website: z.string().max(2048).optional(),
  contact: z.string().max(320).optional(),
  entityRefs: z.array(z.string().min(1).max(2048)).min(1).max(20),
  addresses: z.array(orgAddressSchema).max(20).optional(),
  companySize: z.string().max(64).optional(),
  companyType: z.string().max(64).optional(),
  links: z.array(orgLinkSchema).max(20).optional(),
  industries: z.array(orgIndustrySchema).max(10).optional(),
  founded: orgFoundedSchema.optional(),
  aliases: z.array(z.string().min(1).max(200)).max(20).optional(),
  /**
   * Sole-trader opt-in: keep the claimant's personal profile visible at `/p/`
   * alongside the new company page at `/c/`. Omitted or false presents the
   * account solely as an organization.
   */
  personalProfileVisible: z.boolean().optional(),
  authorityAck: z.literal(true),
});

export type OrgClaimRequestInput = z.infer<typeof OrgClaimRequestSchema>;
