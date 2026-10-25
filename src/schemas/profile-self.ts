import { z } from 'zod';

import {
  datetimeSchema,
  languageTagSchema,
  maxGraphemes,
  profileAboutSchema,
  profileDisplayNameSchema,
  profileHeadlineSchema,
  profileNameSchema,
  profilePronounsSchema,
  selfLabelsSchema,
} from './shared.js';

/**
 * Zod schema for `id.sifa.profile.self` records. Singleton (record key `self`).
 *
 * `knownValues` on `openTo` and `preferredWorkplace` are advisory per the
 * lexicon spec -- unknown values are allowed, but documented options live
 * under the `id.sifa.defs#*` namespace.
 */
export const ProfileSelfRecordSchema = z.object({
  displayName: profileDisplayNameSchema.optional(),
  pronouns: profilePronounsSchema.optional(),
  headline: profileHeadlineSchema.optional(),
  about: profileAboutSchema.optional(),
  industry: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  givenName: profileNameSchema.optional(),
  familyName: profileNameSchema.optional(),
  namePronunciation: profileNameSchema.optional(),
  location: z.unknown().optional(),
  openTo: z.array(z.string()).max(10).optional(),
  preferredWorkplace: z.array(z.string()).max(3).optional(),
  langs: z.array(languageTagSchema).max(3).optional(),
  labels: selfLabelsSchema.optional(),
  discoverable: z.boolean().optional(),
  /**
   * Where the avatar comes from instead of the avatar blob. Open per the
   * lexicon (`knownValues`); Sifa renders `actor.rpg.sprite`, the user's
   * rpg.actor character.
   */
  avatarSource: z.string().max(128).optional(),
  createdAt: datetimeSchema,
});

export type ProfileSelfRecord = z.infer<typeof ProfileSelfRecordSchema>;
