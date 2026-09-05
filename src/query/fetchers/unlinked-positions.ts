import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * A position on the signed-in user's own profile whose free-text company is not
 * yet linked to a canonical company entity. Linking it makes the position roll
 * up under the company's `/c/` page and appear on the company roster.
 */
export interface UnlinkedPosition {
  /** rkey of the `id.sifa.profile.position` record, for deep-linking to the editor. */
  rkey: string;
  /** AT-URI of the position record. */
  uri: string;
  /** The free-text company label the user entered. */
  company: string;
  /** The position title, for display. Absent when the record has none. */
  title?: string;
}

export interface UnlinkedPositionsResult {
  positions: UnlinkedPosition[];
}

export interface FetchUnlinkedPositionsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Positions on the signed-in user's profile with an unlinked company, an "open
 * task" surfaced in the unified Inbox. Requires credentials -- the AppView reads
 * the owner from the session. Returns an empty list on any failure so a broken
 * list degrades to "nothing to link" rather than breaking the hosting surface.
 */
export async function fetchUnlinkedPositions(
  config: SifaApiConfig,
  options: FetchUnlinkedPositionsOptions = {},
): Promise<UnlinkedPositionsResult> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  try {
    const data = await apiFetch<UnlinkedPositionsResult>(config, '/api/positions/unlinked', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    return { positions: Array.isArray(data?.positions) ? data.positions : [] };
  } catch {
    return { positions: [] };
  }
}
