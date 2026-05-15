import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Lightweight profile representation used by discovery endpoints. */
export interface SimilarProfile {
  did: string;
  handle: string;
  displayName?: string | null;
  avatar?: string | null;
  headline?: string | null;
  currentRole?: string | null;
  currentCompany?: string | null;
  industry?: string | null;
  domain?: string | null;
}

export interface SuggestionProfile {
  did: string;
  handle: string;
  displayName?: string;
  headline?: string;
  avatarUrl?: string;
  source: string;
  dismissed: boolean;
  blueskyVerified?: boolean;
}

export interface SuggestionsResponse {
  onSifa: SuggestionProfile[];
  notOnSifa: SuggestionProfile[];
  cursor?: string;
}

export interface FeaturedProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  pronouns?: string;
  headline?: string;
  about?: string;
  currentRole?: string;
  currentCompany?: string;
  locationCountry?: string;
  locationRegion?: string;
  /** Legacy alias for `locationLocality`; emitted by sifa-api during the additive response window. */
  locationCity?: string;
  /** community.lexicon.location.address field name -- prefer over `locationCity`. */
  locationLocality?: string;
  countryCode?: string;
  location?: string;
  website?: string;
  openTo?: string[];
  preferredWorkplace?: string[];
  availableFromUtc?: number;
  availableToUtc?: number;
  followersCount?: number;
  atprotoFollowersCount?: number;
  pdsProvider?: { name: string; host: string } | null;
  claimed: boolean;
  featuredDate: string;
}

/** Profiles similar to the given DID (matchmaking). Returns `[]` on error. */
export async function fetchSimilarProfiles(
  config: SifaApiConfig,
  did: string,
  opts: { limit?: number } & ApiFetchOptions = {},
): Promise<SimilarProfile[]> {
  const limit = opts.limit ?? 5;
  const path = `/api/discover/similar/${encodeURIComponent(did)}?limit=${limit}`;
  try {
    const data = await apiFetch<{ profiles?: SimilarProfile[] }>(config, path, {
      next: { revalidate: 300 },
      timeoutMs: 5000,
      ...opts,
    });
    return data.profiles ?? [];
  } catch {
    return [];
  }
}

export interface FetchSuggestionsOptions extends ApiFetchOptions {
  source?: string;
  includeDismissed?: boolean;
  cursor?: string;
  limit?: number;
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/** Discovery suggestions feed. Resolves to empty arrays on error. */
export async function fetchSuggestions(
  config: SifaApiConfig,
  opts: FetchSuggestionsOptions = {},
): Promise<SuggestionsResponse> {
  const params = new URLSearchParams();
  if (opts.source) params.set('source', opts.source);
  if (opts.includeDismissed) params.set('include_dismissed', 'true');
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.limit) params.set('limit', String(opts.limit));

  const qs = params.toString();
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;

  try {
    return await apiFetch<SuggestionsResponse>(config, `/api/suggestions${qs ? `?${qs}` : ''}`, {
      credentials: 'include',
      cache: 'no-store',
      timeoutMs: 8000,
      ...opts,
      headers,
    });
  } catch {
    return { onSifa: [], notOnSifa: [] };
  }
}

/** Count of pending suggestions since an optional timestamp. */
export async function fetchSuggestionCount(
  config: SifaApiConfig,
  since?: string,
  options: ApiFetchOptions = {},
): Promise<number> {
  const params = since ? `?since=${encodeURIComponent(since)}` : '';
  try {
    const data = await apiFetch<{ count?: number }>(config, `/api/suggestions/count${params}`, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
    });
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

/** Featured profile (rotated by sifa-api). Returns `null` when none. */
export async function fetchFeaturedProfile(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<FeaturedProfile | null> {
  try {
    return await apiFetch<FeaturedProfile>(config, '/api/featured-profile', {
      next: { revalidate: 900 },
      ...options,
    });
  } catch {
    return null;
  }
}
