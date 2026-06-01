import { z } from 'zod';

import { atUriSchema, cidSchema, datetimeSchema, didSchema } from './shared.js';

/**
 * Feed item from `GET /api/following/feed`. Discriminated on `source`:
 *
 * - `sifa`: a Sifa-native event (e.g. profile update, endorsement).
 * - `atmosphere`: a curated creation event from another ATproto app
 *   (Barazo post, etc.). Payload is the hydrated `app.bsky.embed.*#view`
 *   shape, NOT the raw record (per memory `sifa-hydrated-view-embed-types`).
 *
 * Both variants share `actor`, `indexedAt`, and `id` (the materialized
 * `feed_events.id` row identifier, used in the cursor).
 */
export const FeedActorSchema = z.object({
  did: didSchema,
  handle: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type FeedActor = z.infer<typeof FeedActorSchema>;

const FeedItemBaseSchema = z.object({
  id: z.string(),
  actor: FeedActorSchema,
  indexedAt: datetimeSchema,
  eventType: z.string(),
});

export const SifaFeedItemSchema = FeedItemBaseSchema.extend({
  source: z.literal('sifa'),
  appId: z.literal('sifa').optional(),
  payload: z.record(z.string(), z.unknown()),
});

export type SifaFeedItem = z.infer<typeof SifaFeedItemSchema>;

/**
 * ATmosphere feed item. `payload` is intentionally permissive: it carries
 * a hydrated `app.bsky.embed.*#view` shape that varies by source app. The
 * AppView resolves the hydration; clients render via the existing
 * embed-view union (mirrors `sifa-web/src/components/stream/`).
 */
export const AtmosphereFeedItemSchema = FeedItemBaseSchema.extend({
  source: z.literal('atmosphere'),
  appId: z.string(),
  uri: atUriSchema.optional(),
  cid: cidSchema.optional(),
  payload: z.record(z.string(), z.unknown()),
});

export type AtmosphereFeedItem = z.infer<typeof AtmosphereFeedItemSchema>;

export const FollowFeedItemSchema = z.discriminatedUnion('source', [
  SifaFeedItemSchema,
  AtmosphereFeedItemSchema,
]);

export type FollowFeedItem = z.infer<typeof FollowFeedItemSchema>;

export const FollowFeedPageSchema = z.object({
  items: z.array(FollowFeedItemSchema),
  cursor: z.string().nullable(),
});

export type FollowFeedPage = z.infer<typeof FollowFeedPageSchema>;

/**
 * Composite feed cursor `(indexedAt DESC, source, id)`. Encoded as a
 * URL-safe base64 string so it survives `URLSearchParams` round-trips
 * without further encoding. Decoupling encode/decode from the API call
 * lets consumers persist cursors (e.g. for "jump-back-here" UX) and
 * lets us unit-test the format.
 */
export interface FeedCursor {
  indexedAt: string;
  source: 'sifa' | 'atmosphere';
  id: string;
}

const FeedCursorSchema = z.object({
  indexedAt: datetimeSchema,
  source: z.union([z.literal('sifa'), z.literal('atmosphere')]),
  id: z.string().min(1),
});

interface BufferLike {
  from: (input: string, encoding: 'utf-8' | 'base64') => { toString: (encoding: string) => string };
}

interface Base64Global {
  btoa?: (input: string) => string;
  atob?: (input: string) => string;
  Buffer?: BufferLike;
}

function toBase64Url(input: string): string {
  const g = globalThis as unknown as Base64Global;
  const b64: string =
    typeof g.btoa === 'function'
      ? g.btoa(unescape(encodeURIComponent(input)))
      : (g.Buffer as BufferLike).from(input, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  const g = globalThis as unknown as Base64Global;
  if (typeof g.atob === 'function') {
    return decodeURIComponent(escape(g.atob(padded)));
  }
  return (g.Buffer as BufferLike).from(padded, 'base64').toString('utf-8');
}

export function encodeFeedCursor(cursor: FeedCursor): string {
  return toBase64Url(JSON.stringify(cursor));
}

export function decodeFeedCursor(encoded: string): FeedCursor {
  const json = fromBase64Url(encoded);
  const parsed: unknown = JSON.parse(json);
  return FeedCursorSchema.parse(parsed);
}
