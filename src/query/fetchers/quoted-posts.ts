import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

export interface QuotedPostAuthor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface QuotedPostImage {
  thumb: string;
  fullsize: string;
  alt?: string;
}

export interface QuotedPostView {
  uri: string;
  cid: string;
  author: QuotedPostAuthor;
  text: string;
  createdAt: string;
  images?: QuotedPostImage[];
}

export type QuotedPostResult =
  | { status: 'ok'; record: QuotedPostView }
  | { status: 'deleted'; uri: string }
  | { status: 'unavailable'; uri: string };

/** Max URIs per request to `POST /api/quoted-posts/resolve` (mirrors server cap). */
export const QUOTED_POSTS_BATCH_MAX = 20;

export interface ResolveQuotedPostsOptions extends ApiFetchOptions {
  /** Cookie header for Next.js RSC server-side calls; ignored in browsers. */
  cookieHeader?: string;
}

/**
 * Resolve a batch of AT-URIs to their quoted-post snapshots via the Sifa AppView.
 *
 * Auto-deduplicates input URIs and splits requests into chunks of
 * {@link QUOTED_POSTS_BATCH_MAX} so callers can pass an arbitrary-length array.
 * Each chunk is fired in parallel. The server caches results in Valkey, so
 * repeated calls for the same URI are cheap.
 *
 * Returns a map of `uri -> QuotedPostResult`. URIs that fail (network error,
 * non-2xx, or the server omitting them) are absent from the map; the caller
 * should render a skeleton or tombstone for those.
 */
export async function resolveQuotedPosts(
  config: SifaApiConfig,
  uris: string[],
  options: ResolveQuotedPostsOptions = {},
): Promise<Record<string, QuotedPostResult>> {
  if (uris.length === 0) return {};

  const unique = [...new Set(uris)];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += QUOTED_POSTS_BATCH_MAX) {
    batches.push(unique.slice(i, i + QUOTED_POSTS_BATCH_MAX));
  }

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  const results: Record<string, QuotedPostResult> = {};
  await Promise.all(
    batches.map(async (batch) => {
      try {
        const data = await apiFetch<Record<string, QuotedPostResult>>(
          config,
          '/api/quoted-posts/resolve',
          {
            method: 'POST',
            body: { uris: batch },
            credentials: 'include',
            timeoutMs: 8000,
            ...options,
            headers,
          },
        );
        Object.assign(results, data);
      } catch {
        // Leave failed URIs absent so the consumer can render a fallback.
      }
    }),
  );

  return results;
}
