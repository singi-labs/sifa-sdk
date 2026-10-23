import { z } from 'zod';

import { RPG_AVATAR_SOURCE } from '../../rpg/avatar.js';
import { maxBytes, maxGraphemes } from '../shared.js';
import { writeLocationSchema } from './shared.js';

/**
 * A string capped by the `id.sifa.profile.self` lexicon limits: `maxGraphemes`
 * (user-perceived characters) and `maxLength` (UTF-8 bytes). Both are enforced
 * so a value that passes here is also valid against the lexicon.
 */
function lexiconString(graphemes: number, bytes: number) {
  return z
    .string()
    .refine(maxGraphemes(graphemes), { message: `Must be at most ${graphemes} characters` })
    .refine(maxBytes(bytes), { message: `Must be at most ${bytes} bytes of text` });
}

const headlineSchema = lexiconString(120, 1200);
const aboutSchema = lexiconString(5000, 50000);
const nameSchema = lexiconString(64, 640);

/**
 * Schema enforced by `POST /profile/self` on sifa-api.
 *
 * `.passthrough()` so the API accepts fields not yet enumerated here (used for
 * gradual rollout of new profile-self keys without requiring lockstep bumps
 * between web/api). Note this means client validation on this schema will
 * NEVER reject "unknown" fields — the divergence is intentional.
 *
 * headline, about, givenName, familyName and namePronunciation enforce the
 * exact `id.sifa.profile.self` lexicon limits (graphemes and UTF-8 bytes), so
 * the AppView's lexicon gate never rejects a record this schema accepted.
 */
export const ProfileSelfWriteSchema = z
  .object({
    headline: headlineSchema.optional(),
    about: aboutSchema.optional(),
    givenName: nameSchema.optional(),
    familyName: nameSchema.optional(),
    namePronunciation: nameSchema.optional(),
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
  headline: headlineSchema.nullish(),
  about: aboutSchema.nullish(),
  displayName: nameSchema.nullish(),
  pronouns: lexiconString(20, 200).nullish(),
});

export type ProfileOverrideWriteInput = z.infer<typeof ProfileOverrideWriteSchema>;
