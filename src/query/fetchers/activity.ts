import type { ActivityLabel } from '../../cards/adult-content.js';
import { encodeIdentifier, apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';
import type { QuotedPostResult } from './quoted-posts.js';

/**
 * Reachability of an activity card's external destination, as reported by
 * sifa-api's `/api/activity` enrichment (see sifa-api `url-health-checker`).
 *
 *   ok           -- last HEAD returned 2xx/3xx
 *   broken       -- confirmed dead (>=2 consecutive 4xx, or >=5 consecutive 5xx)
 *   unverifiable -- 403/429/network error; anti-bot or rate-limited, NOT dead
 *   unknown      -- newly seen, not yet checked
 *
 * Consumers should only suppress UI on `'broken'`. All other values
 * (including missing) mean "render normally".
 */
export type ActivityItemLinkHealth = 'ok' | 'broken' | 'unverifiable' | 'unknown';

export interface HeatmapDay {
  date: string;
  total: number;
  apps: { appId: string; count: number }[];
}

export interface HeatmapResponse {
  days: HeatmapDay[];
  appTotals: { appId: string; appName: string; total: number }[];
  thresholds: [number, number, number, number];
}

export interface ActivityItem {
  uri: string;
  cid: string;
  collection: string;
  rkey: string;
  record: Record<string, unknown>;
  appId: string;
  appName: string;
  category: string;
  indexedAt: string;
  /**
   * Set by the server when an `app.bsky.embed.record` quote was already
   * resolved upstream (AppView path). Mutually exclusive with `quotedPostUri`.
   */
  quotedPost?: QuotedPostResult;
  /**
   * Set by the server when an `app.bsky.embed.record` quote needs client-side
   * resolution (PDS path). Pass batches to {@link resolveQuotedPosts}.
   * Mutually exclusive with `quotedPost`.
   */
  quotedPostUri?: string;
  /**
   * Reachability of the card's external destination as last checked by
   * sifa-api. Undefined for legacy responses; treat as 'unknown'.
   * See {@link ActivityItemLinkHealth}.
   */
  linkHealth?: ActivityItemLinkHealth;
  /**
   * Content labels from `app.bsky.feed.defs#postView.labels`. Set by
   * sifa-api for Bluesky posts; undefined for other sources and legacy
   * responses. Pass items to {@link hasAdultContent} to decide whether to
   * gate media. See {@link ActivityLabel}.
   */
  labels?: ActivityLabel[];
}

export interface ActivityTeaserResponse {
  items: ActivityItem[];
  blueskyGated?: boolean;
  backfillPending?: boolean;
  failedApps?: string[];
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  cursor: string | null;
  hasMore: boolean;
  availableCategories?: string[];
  blueskyGated?: boolean;
  failedApps?: string[];
}

/**
 * Per-day activity counts for a profile across all ATproto apps. Returns
 * `null` on any error so callers can render a graceful empty state.
 */
export async function fetchHeatmapData(
  config: SifaApiConfig,
  handleOrDid: string,
  days: number,
  options: ApiFetchOptions = {},
): Promise<HeatmapResponse | null> {
  const path = `/api/activity/${encodeIdentifier(handleOrDid)}/heatmap?days=${days}`;
  try {
    return await apiFetch<HeatmapResponse>(config, path, {
      next: { revalidate: 900, tags: [`heatmap-${handleOrDid}`] },
      ...options,
    });
  } catch {
    return null;
  }
}

export interface FetchActivityTeaserOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * Required for authenticated server fetches because `credentials: 'include'`
   * does not propagate browser cookies in RSC.
   */
  cookieHeader?: string;
}

/**
 * Recent activity teaser for a profile (homepage-sized slice). Caps the
 * upstream wait so the SSR path cannot hang. Returns `null` on any error.
 */
export async function fetchActivityTeaser(
  config: SifaApiConfig,
  handleOrDid: string,
  options: FetchActivityTeaserOptions = {},
): Promise<ActivityTeaserResponse | null> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    return await apiFetch<ActivityTeaserResponse>(
      config,
      `/api/activity/${encodeIdentifier(handleOrDid)}/teaser`,
      {
        credentials: 'include',
        timeoutMs: 8000,
        next: { revalidate: 300, tags: [`activity-teaser-${handleOrDid}`] },
        ...options,
        headers,
      },
    );
  } catch {
    return null;
  }
}

export interface FetchActivityFeedOptions extends ApiFetchOptions {
  category?: string;
  limit?: number;
  cursor?: string;
  cookieHeader?: string;
}

/**
 * Paginated activity feed for a profile. Always fresh (`cache: 'no-store'`).
 * Returns `null` on any error.
 */
export async function fetchActivityFeed(
  config: SifaApiConfig,
  handleOrDid: string,
  options: FetchActivityFeedOptions = {},
): Promise<ActivityFeedResponse | null> {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  const qs = params.toString();

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    return await apiFetch<ActivityFeedResponse>(
      config,
      `/api/activity/${encodeIdentifier(handleOrDid)}${qs ? `?${qs}` : ''}`,
      {
        credentials: 'include',
        cache: 'no-store',
        ...options,
        headers,
      },
    );
  } catch {
    return null;
  }
}
