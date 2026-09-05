import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

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

/** Body accepted by {@link dismissUnlinkedPosition}. */
export interface DismissUnlinkedPositionInput {
  /** rkey of the position whose unlinked-company task to dismiss. */
  rkey: string;
}

/**
 * Dismiss the unlinked-company task for one position. Writes nothing to any PDS;
 * it stops the position reappearing in the Inbox (and drops it from the bell
 * count) when there is no company entity worth linking.
 */
export function dismissUnlinkedPosition(
  config: SifaApiConfig,
  data: DismissUnlinkedPositionInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/positions/unlinked/dismiss', 'POST', { body: data, ...options });
}
