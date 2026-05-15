import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Catalog entry describing an ATproto app that Sifa surfaces activity for. */
export interface AppRegistryEntry {
  id: string;
  name: string;
  category: string;
  collectionPrefixes: string[];
  scanCollections: string[];
  urlPattern?: string;
  color: string;
}

/** Compact app representation returned by the hidden-apps endpoint. */
export interface HiddenApp {
  id: string;
  name: string;
  category: string;
}

export interface FetchHiddenAppsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Public app registry shown across discovery surfaces. Heavily cached.
 * Returns `[]` on any error.
 */
export async function fetchAppsRegistry(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<AppRegistryEntry[]> {
  try {
    return await apiFetch<AppRegistryEntry[]>(config, '/api/apps/registry', {
      next: { revalidate: 86400 },
      ...options,
    });
  } catch {
    return [];
  }
}

/**
 * Apps the authenticated user has chosen to hide from their activity feed.
 * Requires an authenticated session. Returns `[]` on any error (including
 * the unauthenticated case).
 */
export async function fetchHiddenApps(
  config: SifaApiConfig,
  options: FetchHiddenAppsOptions = {},
): Promise<HiddenApp[]> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<{ apps: HiddenApp[] }>(config, '/api/profile/hidden-apps', {
      credentials: 'include',
      ...options,
      headers,
    });
    return data.apps;
  } catch {
    return [];
  }
}
