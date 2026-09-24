import { z } from 'zod';

/**
 * Blob-ref passthrough for the org logo. Mirrors the `blobRefSchema` validated
 * by `PUT /api/org/profile` in sifa-api `src/routes/org-settings.ts` -- the
 * shape is validated, then written to the PDS verbatim.
 */
const orgLogoBlobSchema = z.object({
  $type: z.literal('blob'),
  ref: z.object({ $link: z.string().min(1) }),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
});

/**
 * Structured physical address (headquarters, offices). Mirrors
 * `orgAddressSchema` in sifa-api `src/routes/org-settings.ts`: every field is
 * optional and country is NOT ISO-gated here (Sifa handles country codes and
 * final caps at the app layer).
 */
const orgAddressSchema = z.object({
  country: z.string().max(255).optional(),
  postalCode: z.string().max(64).optional(),
  region: z.string().max(255).optional(),
  locality: z.string().max(255).optional(),
  street: z.string().max(2048).optional(),
  name: z.string().max(255).optional(),
});

/**
 * A featured link (name + url). Mirrors `orgLinkSchema` in sifa-api: the url
 * MUST be http(s) -- DOMPurify does not strip a `javascript:`/`data:` scheme
 * from a bare string, so the scheme is rejected here to prevent stored XSS.
 */
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

/**
 * Body accepted by `PUT /api/org/profile` (edit the org record).
 *
 * Mirrors `profileBodySchema` in sifa-api `src/routes/org-settings.ts` EXACTLY.
 * Distinct from {@link OrgClaimRequestSchema}: no `authorityAck` (already
 * asserted at claim time), and an optional `logo` blob ref (a cleared field is
 * omitted, driving the fresh-from-body PDS PUT -- no spread-merge).
 */
export const OrgProfileUpdateRequestSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).optional(),
  website: z.string().max(2048).optional(),
  contact: z.string().max(320).optional(),
  entityRefs: z.array(z.string().min(1).max(2048)).min(1).max(20),
  logo: orgLogoBlobSchema.optional(),
  /** Structured physical locations (headquarters, offices) shown on the org page. */
  addresses: z.array(orgAddressSchema).max(20).optional(),
  /**
   * Self-selected headcount band (a declared bucket, never a calculated count).
   * Open string: any value is accepted so future ranges do not break the
   * contract; the lexicon documents the offered `knownValues`.
   */
  companySize: z.string().max(64).optional(),
  companyType: z.string().max(64).optional(),
  /** Featured links surfaced on the org page (each url http(s)). */
  links: z.array(orgLinkSchema).max(20).optional(),
  /**
   * Self-declared industry/domain pairs (same shape as the person profile).
   * Registry-sourced classifications are layered separately, not self-declared.
   */
  industries: z
    .array(
      z.object({
        industry: z.string().max(100),
        domain: z.string().max(100).optional(),
      }),
    )
    .max(10)
    .optional(),
  /** Self-declared founding date: year (YYYY), month (YYYY-MM), or full date (YYYY-MM-DD). */
  founded: z.string().max(10).optional(),
  /** Self-declared alternative names / acronyms ("also known as"). */
  aliases: z.array(z.string().max(200)).max(20).optional(),
  /** Sole-trader opt-in; see {@link OrgClaimRequestSchema}. Flippable after the claim. */
  personalProfileVisible: z.boolean().optional(),
});

export type OrgProfileUpdateRequestInput = z.infer<typeof OrgProfileUpdateRequestSchema>;

/**
 * Body accepted by `POST /api/org/domains/challenge` (issue a one-time DNS TXT
 * challenge). Mirrors `challengeBodySchema` in sifa-api.
 */
export const OrgDomainChallengeRequestSchema = z.object({
  domain: z.string().min(1).max(255),
});

export type OrgDomainChallengeRequestInput = z.infer<typeof OrgDomainChallengeRequestSchema>;

/**
 * Body accepted by `POST /api/org/domains/verify` (verify a challenge via DoH
 * TXT lookup). Mirrors `verifyBodySchema` in sifa-api.
 */
export const OrgDomainVerifyRequestSchema = z.object({
  token: z.string().min(1).max(2048),
});

export type OrgDomainVerifyRequestInput = z.infer<typeof OrgDomainVerifyRequestSchema>;

/**
 * Body accepted by `POST` and `DELETE /api/org/notification-emails` (add /
 * remove a notification address). Mirrors `notificationEmailBodySchema` in
 * sifa-api. The bound-domain check is server-side (the address must use a
 * domain the org controls).
 */
export const OrgNotificationEmailRequestSchema = z.object({
  email: z.string().email().max(320),
});

export type OrgNotificationEmailRequestInput = z.infer<typeof OrgNotificationEmailRequestSchema>;
