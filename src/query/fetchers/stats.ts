import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Public, aggregate stats shown on the homepage and similar surfaces. */
export interface StatsResponse {
  profileCount: number;
  avatars: string[];
  atproto: {
    userCount: number;
    growthPerSecond: number;
    timestamp: number;
  } | null;
}

/**
 * Homepage stats (profile count, avatar samples, ATproto growth). Public
 * endpoint -- safe to cache. Returns `null` on any error so callers can
 * render a graceful empty state.
 */
export async function fetchStats(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<StatsResponse | null> {
  try {
    return await apiFetch<StatsResponse>(config, '/api/stats', {
      next: { revalidate: 900 },
      ...options,
    });
  } catch {
    return null;
  }
}
