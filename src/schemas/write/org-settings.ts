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
