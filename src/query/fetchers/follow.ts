import {
  apiFetch,
  encodeIdentifier,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';
import type { ActivityFeedResponse } from './activity.js';

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
    `/api/follow/${encodeIdentifier(handle)}`,
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
  return apiWrite(config, `/api/follow/${encodeIdentifier(handle)}`, 'DELETE', opts);
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
      buildListPath(`/api/profile/${encodeIdentifier(handle)}/followers`, opts),
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
      buildListPath(`/api/profile/${encodeIdentifier(handle)}/following`, opts),
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { follows: res.follows, cursor: res.cursor ?? null };
  } catch {
    return { follows: [], cursor: null };
  }
}

/** The method binding for the following-feed service-auth token; MUST match the
 *  sifa-api endpoint's `lxm`. */
export const FOLLOWING_FEED_LXM = 'id.sifa.feed.getFollowingFeed';

/** One app the viewer's network is active on, for the feed's source tabs. */
export interface FollowingFeedApp {
  /** Registry app id, e.g. `tangled`. Pass back as {@link FetchFollowingFeedOptions.app}. */
  id: string;
  name: string;
  /** Summed recent activity across the network; the tab ordering. */
  count: number;
}

/**
 * Why a following-feed page came back empty. Lets a client say something true
 * per case instead of one catch-all sentence, and point at the right next step.
 */
export type FollowingFeedEmptyReason =
  | 'no_follows'
  | 'no_visible_follows'
  | 'no_cross_app_activity'
  | 'no_recent_records'
  | 'all_hidden'
  | 'nothing_renderable'
  | 'hydration_failed';

/** Options for {@link fetchFollowingFeed}. */
export interface FetchFollowingFeedOptions extends ApiFetchOptions {
  limit?: number;
  /**
   * Opt in to the viewer's Bluesky activity too. Off by default: the point of
   * the feed is what connections do on OTHER apps.
   *
   * Ignored when {@link app} is set, since a source tab selects one app.
   */
  includeBluesky?: boolean;
  /**
   * Restrict the page to one app (a registry id from the response's `apps`).
   * This is what a source tab selects. `app: 'bluesky'` selects Bluesky even
   * though it is excluded from the default mixed view.
   */
  app?: string;
  /** Forward a `Cookie` header on Next.js RSC server-side calls (web). */
  cookieHeader?: string;
}

/** The following feed's response: an activity feed plus its tab metadata. */
export interface FollowingFeedResponse extends ActivityFeedResponse {
  /**
   * Apps the viewer's network is actually active on, most active first.
   * Present on empty pages too, so a client's tabs survive a quiet tab.
   */
  apps?: FollowingFeedApp[];
  /** Set only when `items` is empty. */
  reason?: FollowingFeedEmptyReason;
}

/**
 * The viewer's cross-app following feed: what OTHER apps their connections use
 * (Tangled, WhiteWind, Smoke Signal, ...) — Bluesky is excluded server-side by
 * default, as it is the least interesting part and other apps already surface
 * it. Pass `includeBluesky: true` to bring it back in.
 *
 * Auth is identity-only server-side, so the NATIVE app supplies
 * `config.getAuthToken` to mint a service-auth Bearer, while WEB relies on its
 * session cookie (`credentials: 'include'`). Returns `null` on error. v1 is a
 * finite first page (no cursor yet).
 */
export async function fetchFollowingFeed(
  config: SifaApiConfig,
  opts: FetchFollowingFeedOptions = {},
): Promise<FollowingFeedResponse | null> {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  // A selected tab decides Bluesky on its own, so the flag is not also sent.
  if (opts.app) params.set('app', opts.app);
  else if (opts.includeBluesky) params.set('includeBluesky', 'true');
  const qs = params.toString();

  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;
  if (config.getAuthToken) {
    const token = await config.getAuthToken(FOLLOWING_FEED_LXM);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await apiFetch<FollowingFeedResponse>(
      config,
      `/api/following/feed${qs ? `?${qs}` : ''}`,
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
  } catch {
    return null;
  }
}
