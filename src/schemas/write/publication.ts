import { z } from 'zod';

import { optionalUrl } from './shared.js';

/**
 * A co-author named on the publication.
 *
 * Name-first, unlike a project member, and that is the lexicon's shape rather
 * than an inconsistency: a paper has co-authors whether or not they are on
 * atproto. A name alone is a complete entry that renders as written and claims
 * nothing about any account.
 *
 * `did` is the optional extra that turns the entry into a claim. The named
 * person renders as a bare name until they publish an `id.sifa.confirmation`,
 * and confirming never puts this record on their profile.
 */
export const publicationAuthorWriteSchema = z.object({
  name: z.string().min(1).max(100),
  did: z
    .string()
    .regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID')
    .optional(),
});

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.publication`. */
export const PublicationWriteSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(2000).nullable().optional(),
  publisher: z.string().max(256).nullable().optional(),
  url: optionalUrl(),
  description: z.string().max(50000).nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  // Absent here until now, so the write route stripped every co-author before
  // it reached the PDS: the lexicon field, the indexer, the claim flattening
  // and the editor all existed, and nothing joined them. An object schema
  // drops unknown keys silently, so the editor reported success and wrote
  // nothing.
  authors: z.array(publicationAuthorWriteSchema).max(50).optional(),
});

export type PublicationWriteInput = z.infer<typeof PublicationWriteSchema>;
