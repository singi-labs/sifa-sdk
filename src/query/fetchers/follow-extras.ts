import { encodeIdentifier, apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';
import type { FollowProfileItem } from '../../schemas/follow-profile.js';

/**
 * Options shared by the cursor-paginated follow-graph endpoints introduced in
 * `sifa-api#674` (mutuals + bluesky-suggestions). Mirrors
 * `FetchFollowListOptions` in `./follow.ts` but the response wrapper here uses
 * the `{ items, cursor }` shape (not `{ follows, cursor }`).
 */
export interface FetchFollowProfilePageOptions extends ApiFetchOptions {
  cursor?: string;
  limit?: number;
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls
   * (mirrors `FetchFollowListOptions`; required for authenticated server
   * fetches because `credentials: 'include'` does not propagate cookies from
   * RSC).
   */
  cookieHeader?: string;
}

/** Page of {@link FollowProfileItem} rows with an opaque next-page cursor. */
export interface FollowProfilePageResponse {
  items: FollowProfileItem[];
  cursor: string | null;
}

function buildListPath(prefix: string, opts: FetchFollowProfilePageOptions): string {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return `${prefix}${qs ? `?${qs}` : ''}`;
}

async function fetchFollowProfilePage(
  config: SifaApiConfig,
  path: string,
  opts: FetchFollowProfilePageOptions,
): Promise<FollowProfilePageResponse> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;
  try {
    const res = await apiFetch<{ items?: FollowProfileItem[]; cursor?: string | null }>(
      config,
      path,
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { items: res.items ?? [], cursor: res.cursor ?? null };
  } catch {
    return { items: [], cursor: null };
  }
}

/**
 * Cursor-paginated list of mutual sifa-source follows for `handleOrDid`
 * (X↔Y both follow each other on Sifa). Backed by
 * `GET /api/profile/{handleOrDid}/mutuals` from `sifa-api#674`. Public —
 * does not require auth. Returns an empty page on error.
 */
export async function getMutuals(
  config: SifaApiConfig,
  handleOrDid: string,
  opts: FetchFollowProfilePageOptions = {},
): Promise<FollowProfilePageResponse> {
  return fetchFollowProfilePage(
    config,
    buildListPath(`/api/profile/${encodeIdentifier(handleOrDid)}/mutuals`, opts),
    opts,
  );
}

/**
 * Cursor-paginated list of Sifa users the viewer follows on Bluesky but NOT
 * on Sifa, filtered to people active on Sifa. Backed by
 * `GET /api/me/bluesky-suggestions` from `sifa-api#674`. Auth-required.
 * Returns an empty page on error.
 */
export async function getBlueskySuggestions(
  config: SifaApiConfig,
  opts: FetchFollowProfilePageOptions = {},
): Promise<FollowProfilePageResponse> {
  return fetchFollowProfilePage(config, buildListPath('/api/me/bluesky-suggestions', opts), opts);
}
