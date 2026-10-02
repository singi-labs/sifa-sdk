import type { SiteActivityPreset } from '../../logic/site-activity-preset.js';
import {
  apiFetch,
  apiWrite,
  encodeIdentifier,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * The authenticated user's activity preferences, resolved to an answer for
 * every known key. `sitePreset` is the personal-site "show only" filter; both
 * lists empty means no preset.
 */
export interface ActivityPreferences {
  streamCategories: Record<string, boolean>;
  digestItemTypes: Record<string, boolean>;
  sitePreset: SiteActivityPreset;
}

/**
 * Partial update. Only the keys present change. `sitePreset`, when present,
 * replaces the whole stored preset; send empty lists to clear it.
 */
export interface UpdateActivityPreferencesInput {
  streamCategories?: Record<string, boolean>;
  digestItemTypes?: Record<string, boolean>;
  sitePreset?: SiteActivityPreset;
}

/** A user's personal-site preset as anyone can read it. */
export interface SiteActivityPresetResponse extends SiteActivityPreset {
  did: string;
  /** False when both lists are empty, i.e. the site shows all activity. */
  active: boolean;
}

export interface FetchActivityPreferencesOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC.
   */
  cookieHeader?: string;
}

/** The caller's own preferences. Returns `null` on any error. */
export async function fetchActivityPreferences(
  config: SifaApiConfig,
  options: FetchActivityPreferencesOptions = {},
): Promise<ActivityPreferences | null> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    return await apiFetch<ActivityPreferences>(config, '/api/activity-preferences', {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers,
    });
  } catch {
    return null;
  }
}

/** Update the caller's own preferences. */
export function updateActivityPreferences(
  config: SifaApiConfig,
  input: UpdateActivityPreferencesInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult<Partial<ActivityPreferences>>> {
  return apiWrite<Partial<ActivityPreferences>>(config, '/api/activity-preferences', 'PUT', {
    ...options,
    body: input,
  });
}

/**
 * Public read of a user's personal-site preset, by handle or DID. Site
 * builders use it to show the same activity page.sifa.id shows. Returns
 * `null` on any error.
 */
export async function fetchSiteActivityPreset(
  config: SifaApiConfig,
  handleOrDid: string,
  options: ApiFetchOptions = {},
): Promise<SiteActivityPresetResponse | null> {
  try {
    return await apiFetch<SiteActivityPresetResponse>(
      config,
      `/api/activity-preferences/site-preset/${encodeIdentifier(handleOrDid)}`,
      options,
    );
  } catch {
    return null;
  }
}
