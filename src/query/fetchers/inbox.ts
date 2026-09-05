import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Counts that drive the unified Inbox badge on the header bell.
 *
 * Both numbers are computed server-side and are DISJOINT, so summing them never
 * double-counts a single event:
 *
 * - `tasks` — open items that need the signed-in user's decision or attention.
 *   As of this release it counts: pending confirmations, pending endorsement
 *   requests, confirmation drift/withdrawn, positions with an unlinked company,
 *   and (as 1) an incomplete profile. This set is defined by the AppView and MAY
 *   GROW in future without an SDK release, so treat `tasks` as "how many things
 *   need attention", not as a fixed sum of specific sources.
 * - `unreadNotifications` — unread passive notifications, EXCLUDING the actionable
 *   types already counted in `tasks` (e.g. `confirmation_requested`,
 *   `endorsement_received`). Computed as the residual of total unread minus
 *   task-owned types, so a new/unknown actionable type still surfaces somewhere
 *   rather than vanishing.
 */
export interface InboxCounts {
  tasks: number;
  unreadNotifications: number;
}

export interface FetchInboxCountsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Combined inbox counts for the signed-in user, for the header bell badge.
 *
 * Requires credentials -- the AppView reads the subject from the session, not a
 * parameter. Returns `{ tasks: 0, unreadNotifications: 0 }` on ANY failure,
 * including the unauthenticated case, so the badge degrades to "nothing waiting"
 * rather than breaking the header. As a consequence the hook never surfaces an
 * error (`isError` stays false); a persistently-down endpoint is indistinguishable
 * from a genuine zero. That trade-off is deliberate for a poll-driven badge.
 */
export async function fetchInboxCounts(
  config: SifaApiConfig,
  options: FetchInboxCountsOptions = {},
): Promise<InboxCounts> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<InboxCounts>(config, '/api/inbox/counts', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...options,
      headers,
    });
    return {
      tasks: data?.tasks ?? 0,
      unreadNotifications: data?.unreadNotifications ?? 0,
    };
  } catch {
    return { tasks: 0, unreadNotifications: 0 };
  }
}
