import { z } from 'zod';

import { RPG_AVATAR_SOURCE } from '../../rpg/avatar.js';
import { writeLocationSchema } from './shared.js';

/**
 * Schema enforced by `POST /profile/self` on sifa-api.
 *
 * `.passthrough()` so the API accepts fields not yet enumerated here (used for
 * gradual rollout of new profile-self keys without requiring lockstep bumps
 * between web/api). Note this means client validation on this schema will
 * NEVER reject "unknown" fields — the divergence is intentional.
 *
 * Grapheme caps (e.g. 64 on given/familyName) are enforced client-side by the
 * SDK's lexicon schema; the write schema only guards the byte-length ceiling.
 */
export const ProfileSelfWriteSchema = z
  .object({
    headline: z.string().max(300).optional(),
    about: z.string().max(50000).optional(),
    givenName: z.string().max(640).optional(),
    familyName: z.string().max(640).optional(),
    namePronunciation: z.string().max(640).optional(),
    industries: z
      .array(
        z.object({
          industry: z.string().max(100),
          domain: z.string().max(100).optional(),
        }),
      )
      .max(10)
      .optional(),
    location: writeLocationSchema,
    openTo: z.array(z.string()).max(10).optional(),
    preferredWorkplace: z.array(z.string()).max(5).optional(),
    availableFromUtc: z.number().int().min(0).max(23).optional(),
    availableToUtc: z.number().int().min(0).max(23).optional(),
    langs: z.array(z.string()).max(3).optional(),
    discoverable: z.boolean().optional(),
    /**
     * `actor.rpg.sprite` uses the user's rpg.actor character as their avatar;
     * `null` turns it off (the uploaded avatar, or the Bluesky one, comes
     * back). Omitted leaves the current choice unchanged. Only values Sifa can
     * render are accepted.
     */
    avatarSource: z.enum([RPG_AVATAR_SOURCE]).nullable().optional(),
  })
  .passthrough();

export type ProfileSelfWriteInput = z.infer<typeof ProfileSelfWriteSchema>;
