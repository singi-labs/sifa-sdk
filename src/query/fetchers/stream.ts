import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

export interface FetchNetworkStreamCountOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * Required for authenticated server fetches because `credentials: 'include'`
   * does not propagate browser cookies in RSC.
   *
   * When omitted, the request falls back to `credentials: 'include'` so
   * client-side calls work without extra plumbing.
   */
  cookieHeader?: string;
}

/**
 * Counts items in the authenticated user's network stream digest. The
 * underlying `GET /api/stream/network` endpoint may 404 while the feature
 * is in development; in that case (and on any other error) this returns
 * 0 so callers can route safely to a fallback experience.
 */
export async function fetchNetworkStreamCount(
  config: SifaApiConfig,
  did: string,
  options: FetchNetworkStreamCountOptions = {},
): Promise<number> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<unknown>(
      config,
      `/api/stream/network?did=${encodeURIComponent(did)}`,
      {
        cache: 'no-store',
        timeoutMs: 5000,
        ...(options.cookieHeader ? {} : { credentials: 'include' }),
        ...options,
        headers,
      },
    );
    if (typeof data !== 'object' || data === null || !('items' in data)) {
      return 0;
    }
    const items = data.items;
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}
