import { z } from 'zod';

import {
  VERIFICATION_PROVIDERS,
  type AccountVerification,
  type VerificationProviderId,
} from '../taxonomy/verification-providers.js';
import { datetimeSchema, didSchema } from './shared.js';

const AccountVerificationSchema = z.object({
  provider: z.custom<VerificationProviderId>(
    (value) => typeof value === 'string' && Object.hasOwn(VERIFICATION_PROVIDERS, value),
  ),
  verifiedAt: datetimeSchema.nullable().optional(),
  issuerDid: didSchema.nullable().optional(),
});

/**
 * `verificationBadges[]` as emitted by the AppView. A badge from a provider this
 * SDK version does not know (or a malformed entry) is dropped instead of failing
 * the whole row, so a new server-side provider never breaks older clients.
 */
const VerificationBadgesSchema = z.array(z.unknown()).transform((items): AccountVerification[] =>
  items.flatMap((item) => {
    const result = AccountVerificationSchema.safeParse(item);
    return result.success ? [result.data] : [];
  }),
);

/**
 * Profile row shared across `/api/following`, `/api/profile/:handleOrDid/mutuals`,
 * and `/api/me/bluesky-suggestions`. Matches the existing `FollowProfile` TS
 * interface byte-for-byte but adds runtime validation for the SDK's pagination
 * helpers and the upcoming `sifa-app` consumer (where we can't trust the wire).
 *
 * Per `sifa-api#674` PR body: mutuals + bluesky-suggestions reuse this shape
 * exactly, so a single Zod schema covers all three endpoints.
 */
export const FollowProfileSchema = z.object({
  did: didSchema,
  handle: z.string(),
  displayName: z.string().optional(),
  headline: z.string().optional(),
  avatarUrl: z.string().optional(),
  source: z.string(),
  claimed: z.boolean(),
  followedAt: datetimeSchema,
  blueskyVerified: z.boolean().optional(),
  blueskyVerifiedAt: datetimeSchema.nullable().optional(),
  verificationBadges: VerificationBadgesSchema.optional(),
});

export type FollowProfileItem = z.infer<typeof FollowProfileSchema>;

/**
 * Cursor-paginated page of {@link FollowProfileSchema} rows. Used by mutuals
 * + bluesky-suggestions. The legacy `/api/following` endpoint uses a different
 * wrapper key (`follows` instead of `items`) and is intentionally NOT covered
 * by this schema.
 */
export const FollowProfilePageSchema = z.object({
  items: z.array(FollowProfileSchema),
  cursor: z.string().nullable(),
});

export type FollowProfilePage = z.infer<typeof FollowProfilePageSchema>;

/**
 * Per-flag allowlist row returned by `GET /api/admin/feature-allowlists/:flag`.
 * Mirrors the `feature_allowlists` table; `note` is optional free-form text.
 */
export const FeatureAllowlistEntrySchema = z.object({
  did: didSchema,
  addedAt: datetimeSchema,
  note: z.string().nullable().optional(),
});

export type FeatureAllowlistEntry = z.infer<typeof FeatureAllowlistEntrySchema>;

/**
 * Known feature flags accepted by the admin allowlist endpoints. Mirrors the
 * server-side `FEATURE_FLAGS` const in `sifa-api`. Kept as a `const` tuple so
 * consumers can `as const`-narrow when building UIs.
 */
export const FEATURE_FLAGS = ['FEED_V5_ENABLED'] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
