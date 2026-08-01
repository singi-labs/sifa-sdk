import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  externalRecordRefSchema,
  maxGraphemes,
  partialDateSchema,
  selfLabelsSchema,
  uriSchema,
} from './shared.js';
import { projectMemberRefSchema } from './profile-project.js';

/** Collection NSID for involvement records. Pass to the generic record helpers. */
export const PROFILE_INVOLVEMENT_NSID = 'id.sifa.profile.involvement';

/**
 * A public artifact proving a piece of work. Mirrors `id.sifa.defs#artifactLink`.
 * `kind` is an open enum (bare-string knownValues), so any string is accepted.
 * `.passthrough()` keeps unknown fields a newer client or co-writer may emit.
 */
export const ArtifactLinkSchema = z
  .object({
    url: uriSchema,
    kind: z.string().optional(),
    label: z.string().refine(maxGraphemes(200)).max(2000).optional(),
  })
  .passthrough();

export type ArtifactLink = z.infer<typeof ArtifactLinkSchema>;

/**
 * Zod schema for `id.sifa.profile.involvement` records.
 *
 * `.passthrough()` (not `.strict()`): external apps (Verak, weareonhire)
 * co-write `id.sifa.*`, so an older SDK must not reject a record carrying a
 * field it doesn't know yet. `kind` is an open enum matching the lexicon's
 * knownValues but accepting any string for the same forward-compat reason.
 */
export const ProfileInvolvementRecordSchema = z
  .object({
    kind: z.string(),
    upstream: z.string().refine(maxGraphemes(256)).max(2560).optional(),
    upstreamDid: didSchema.optional(),
    upstreamUrl: uriSchema.optional(),
    role: z.string().refine(maxGraphemes(256)).max(2560).optional(),
    description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
    startedAt: partialDateSchema.optional(),
    endedAt: partialDateSchema.optional(),
    links: z.array(ArtifactLinkSchema).max(50).optional(),
    // Portable org entity identifier (Wikidata/ROR/LEI URI) from the resolver
    // typeahead, constrained to http(s) so a script scheme is never a valid ref.
    entityRef: z
      .string()
      .url()
      .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
      .max(2048)
      .optional(),
    // community.lexicon.location.address — validated at the app layer.
    location: z.unknown().optional(),
    // id.sifa.defs#skillRef references (at-uri to a skill record in the same repo).
    skills: z
      .array(z.object({ uri: z.string() }))
      .max(50)
      .optional(),
    labels: selfLabelsSchema.optional(),
    collaborators: z.array(projectMemberRefSchema).max(50).optional(),
    sameAs: externalRecordRefSchema.optional(),
    createdAt: datetimeSchema,
  })
  .passthrough();

export type ProfileInvolvementRecord = z.infer<typeof ProfileInvolvementRecordSchema>;
