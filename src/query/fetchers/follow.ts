import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

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
