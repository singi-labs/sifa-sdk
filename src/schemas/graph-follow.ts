import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes } from './shared.js';

/**
 * Zod schema for `id.sifa.graph.follow` records.
 *
 * One-way professional follow; the record lives in the follower's PDS. Per
 * iter-1 decisions (`plans/2026-06-01-in-sifa-follow-primitive.md`), this is
 * a **distinct** graph from `app.bsky.graph.follow`, not a superset — but
 * the required field shape (`subject` + `createdAt`) is intentionally
 * identical so generic Bluesky `listRecords` consumers get usable records.
 *
 * `note` is a Sifa addition: an optional reason for the follow ("why I
 * followed"). Capped at 200 graphemes to match other profile-flavored
 * lexicon fields.
 */
export const GraphFollowRecordSchema = z.object({
  subject: didSchema,
  createdAt: datetimeSchema,
  note: z.string().refine(maxGraphemes(200), 'note must be at most 200 graphemes').optional(),
});

export type GraphFollowRecord = z.infer<typeof GraphFollowRecordSchema>;

/**
 * Build a `GraphFollowRecordSchema` that rejects self-follow at the Zod
 * layer (CLAUDE.md mandatory standards #3 — input validation; sifa-api#673
 * E8 — defence in depth).
 *
 * Use this on the **client side** when constructing a new follow record
 * (the follower DID is the authenticated user). The plain
 * {@link GraphFollowRecordSchema} stays without the refine so firehose
 * consumers can validate records without context.
 */
export function makeGraphFollowRecordSchema(followerDid: string) {
  return GraphFollowRecordSchema.refine((record) => record.subject !== followerDid, {
    message: 'Self-follow is not allowed',
    path: ['subject'],
  });
}
