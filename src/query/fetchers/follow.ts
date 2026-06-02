import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';
import type { FollowFeedPage } from '../../schemas/feed.js';

export interface FollowProfile {
  did: string;
  handle: string;
  displayName?: string;
  headline?: string;
  avatarUrl?: string;
  source: string;
  claimed: boolean;
  followedAt: string;
  blueskyVerified?: boolean;
  blueskyVerifiedAt?: string | null;
}

export interface FollowingResponse {
  follows: FollowProfile[];
  cursor?: string;
}

/** People the authenticated user follows. Empty on error. */
export async function fetchFollowing(
  config: SifaApiConfig,
  opts: { source?: string; cursor?: string; limit?: number } & ApiFetchOptions = {},
): Promise<FollowingResponse> {
  const params = new URLSearchParams();
  if (opts.source) params.set('source', opts.source);
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();

  try {
    return await apiFetch<FollowingResponse>(config, `/api/following${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
      cache: 'no-store',
      ...opts,
    });
  } catch {
    return { follows: [] };
  }
}

/**
 * Result of {@link followUser}. Extends {@link WriteResult} with the
 * follow `rkey` returned by sifa-api on success. Self-follow + invalid
 * handle surface as `success: false` with the server-provided message;
 * dup-follow is idempotent (sifa-api E7) and resolves as `success: true`.
 */
export interface FollowUserResult extends WriteResult {
  rkey?: string;
  /** DID of the followed subject (server-resolved from the handle). */
  subjectDid?: string;
}

/**
 * Create an `id.sifa.graph.follow` record on the caller's PDS via the
 * AppView. Idempotent on duplicate (server catches the unique-violation
 * and returns 200, per sifa-api#673 E7).
 */
export function followUser(
  config: SifaApiConfig,
  handle: string,
  opts: { note?: string } & Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<FollowUserResult> {
  const { note, ...rest } = opts;
  return apiWrite<{ rkey?: string; subjectDid?: string }>(
    config,
    `/api/follow/${encodeURIComponent(handle)}`,
    'POST',
    {
      body: note !== undefined ? { note } : undefined,
      ...rest,
    },
  );
}

/** Delete the authenticated viewer's `id.sifa.graph.follow` for `handle`. */
export function unfollowUser(
  config: SifaApiConfig,
  handle: string,
  opts: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/follow/${encodeURIComponent(handle)}`, 'DELETE', opts);
}

export interface FollowListPage {
  follows: FollowProfile[];
  cursor: string | null;
}

export interface FetchFollowListOptions extends ApiFetchOptions {
  cursor?: string;
  limit?: number;
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls
   * (mirrors {@link FetchActivityFeedOptions}; required for authenticated
   * server fetches because `credentials: 'include'` does not propagate
   * cookies from RSC).
   */
  cookieHeader?: string;
}

function buildListPath(prefix: string, opts: FetchFollowListOptions): string {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return `${prefix}${qs ? `?${qs}` : ''}`;
}

/**
 * Paginated list of `handle`'s followers. Returns an empty page on error
 * so the UI can render a graceful "no followers yet" state.
 */
export async function getFollowers(
  config: SifaApiConfig,
  handle: string,
  opts: FetchFollowListOptions = {},
): Promise<FollowListPage> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;
  try {
    const res = await apiFetch<{ follows: FollowProfile[]; cursor?: string | null }>(
      config,
      buildListPath(`/api/profile/${encodeURIComponent(handle)}/followers`, opts),
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { follows: res.follows, cursor: res.cursor ?? null };
  } catch {
    return { follows: [], cursor: null };
  }
}

/** Paginated list of who `handle` follows. */
export async function getFollowing(
  config: SifaApiConfig,
  handle: string,
  opts: FetchFollowListOptions = {},
): Promise<FollowListPage> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;
  try {
    const res = await apiFetch<{ follows: FollowProfile[]; cursor?: string | null }>(
      config,
      buildListPath(`/api/profile/${encodeURIComponent(handle)}/following`, opts),
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { follows: res.follows, cursor: res.cursor ?? null };
  } catch {
    return { follows: [], cursor: null };
  }
}

/**
 * @deprecated The `/api/following/feed` surface was reverted (sifa-api#674).
 *   Per `decisions/activity-data-strategy.md` the Sifa Timeline + ATmosphere
 *   Stream are two distinct surfaces with different data paths (Barazo API
 *   for Timeline, live PDS reads + Valkey for Stream). These collapsed feed
 *   types are no longer consumed. Scheduled for removal in next major bump.
 */
export interface FetchFollowingFeedOptions extends ApiFetchOptions {
  cursor?: string;
  limit?: number;
  /**
   * Comma-separated category filter (per sifa-api#673 TR10). Forwarded
   * as-is; the server validates allowed values.
   */
  categories?: string[];
  cookieHeader?: string;
}

/**
 * V5 home feed: Sifa events + curated ATmosphere creation events filtered
 * by the authenticated viewer's followees. Composite cursor (per E5/TR4).
 * Returns an empty page on error.
 *
 * @deprecated The `/api/following/feed` surface was reverted (sifa-api#674).
 *   Per `decisions/activity-data-strategy.md` the Sifa Timeline + ATmosphere
 *   Stream are two distinct surfaces with different data paths (Barazo API
 *   for Timeline, live PDS reads + Valkey for Stream). This fetcher is no
 *   longer consumed. Scheduled for removal in next major bump.
 */
export async function getFollowingFeed(
  config: SifaApiConfig,
  opts: FetchFollowingFeedOptions = {},
): Promise<FollowFeedPage> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.categories && opts.categories.length > 0) {
    params.set('categories', opts.categories.join(','));
  }
  const qs = params.toString();

  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;

  try {
    const res = await apiFetch<{ items: FollowFeedPage['items']; cursor?: string | null }>(
      config,
      `/api/following/feed${qs ? `?${qs}` : ''}`,
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { items: res.items ?? [], cursor: res.cursor ?? null };
  } catch {
    return { items: [], cursor: null };
  }
}
