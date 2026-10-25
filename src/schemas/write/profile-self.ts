import { z } from 'zod';

import { RPG_AVATAR_SOURCE } from '../../rpg/avatar.js';
import {
  profileAboutSchema,
  profileDisplayNameSchema,
  profileHeadlineSchema,
  profileNameSchema,
  profilePronounsSchema,
} from '../shared.js';
import { writeLocationSchema } from './shared.js';

/**
 * Schema enforced by `POST /profile/self` on sifa-api.
 *
 * `.passthrough()` so the API accepts fields not yet enumerated here (used for
 * gradual rollout of new profile-self keys without requiring lockstep bumps
 * between web/api). Note this means client validation on this schema will
 * NEVER reject "unknown" fields — the divergence is intentional.
 *
 * headline, about, givenName, familyName and namePronunciation match the
 * `id.sifa.profile.self` lexicon's grapheme and UTF-8 byte limits. Other fields
 * (for example `langs` formats) are not checked against the lexicon here.
 */
export const ProfileSelfWriteSchema = z
  .object({
    headline: profileHeadlineSchema.optional(),
    about: profileAboutSchema.optional(),
    givenName: profileNameSchema.optional(),
    familyName: profileNameSchema.optional(),
    namePronunciation: profileNameSchema.optional(),
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

/**
 * Override fields validated by sifa-api's profile override route. `displayName`
 * and `pronouns` are not part of `ProfileSelfWriteSchema`; every field is
 * nullish (`null` clears an override). Limits mirror `id.sifa.profile.self`.
 */
export const ProfileOverrideWriteSchema = z.object({
  headline: profileHeadlineSchema.nullish(),
  about: profileAboutSchema.nullish(),
  displayName: profileDisplayNameSchema.nullish(),
  pronouns: profilePronounsSchema.nullish(),
});

export type ProfileOverrideWriteInput = z.infer<typeof ProfileOverrideWriteSchema>;
