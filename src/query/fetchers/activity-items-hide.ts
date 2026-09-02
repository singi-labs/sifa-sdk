import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

export interface HideActivityItemInput {
  /** AT-URI of the record, or the item URL for externally-sourced items. */
  uri: string;
  /** Collection NSID (or synthetic collection, e.g. `fediverse.post`). */
  collection: string;
  /**
   * Registry app id the item belongs to. Optional, and used only to take the
   * item out of the owner's OG-image activity spine, which is computed from
   * per-(day, app) counts and never sees a URI.
   */
  appId?: string;
  /** UTC day the item was created (`YYYY-MM-DD`), for the same reason. */
  activityDate?: string;
}

export interface UnhideActivityItemInput {
  uri: string;
}

/** One activity item the authenticated user has hidden from their profile. */
export interface HiddenActivityItem {
  uri: string;
  collection: string;
  appId: string | null;
  activityDate: string | null;
  hiddenAt: string;
}

export interface FetchHiddenActivityItemsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC.
   */
  cookieHeader?: string;
}

/**
 * Hide one activity item from the authenticated user's profile. The record
 * stays on their PDS and stays readable by every other app; only its
 * appearance on sifa.id is suppressed.
 */
export function hideActivityItem(
  config: SifaApiConfig,
  input: HideActivityItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/activity/items/hide', 'POST', { ...options, body: input });
}

/** Restore a previously-hidden activity item. */
export function unhideActivityItem(
  config: SifaApiConfig,
  input: UnhideActivityItemInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/activity/items/hide', 'DELETE', { ...options, body: input });
}

/**
 * Everything the authenticated user has hidden, newest hide first. Returns
 * `[]` on any error so a settings page can still render.
 */
export async function fetchHiddenActivityItems(
  config: SifaApiConfig,
  options: FetchHiddenActivityItemsOptions = {},
): Promise<HiddenActivityItem[]> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<{ items: HiddenActivityItem[] }>(
      config,
      '/api/activity/hidden-items',
      { credentials: 'include', ...options, headers },
    );
    return data.items;
  } catch {
    return [];
  }
}
