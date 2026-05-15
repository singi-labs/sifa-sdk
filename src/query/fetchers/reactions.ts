import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Per-URI reaction state for the authenticated viewer. */
export interface ReactionStatus {
  reacted: boolean;
  rkey?: string;
  collection?: string;
}

/** Result of checking whether the authenticated viewer has an account on a given app. */
export interface AccountCheckResult {
  hasAccount: boolean;
  appName: string;
  appUrl: string;
}

export interface FetchReactionStatusOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * Required for authenticated server fetches because `credentials: 'include'`
   * does not propagate browser cookies in RSC.
   */
  cookieHeader?: string;
}

/**
 * Batch-look up reaction status for multiple URIs. Returns `{}` for an
 * empty input list (no network call) and `null` on any error.
 */
export async function fetchReactionStatus(
  config: SifaApiConfig,
  uris: string[],
  options: FetchReactionStatusOptions = {},
): Promise<Record<string, ReactionStatus> | null> {
  if (uris.length === 0) return {};

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    return await apiFetch<Record<string, ReactionStatus>>(
      config,
      `/api/reactions/status?uris=${encodeURIComponent(uris.join(','))}`,
      {
        credentials: 'include',
        ...options,
        headers,
      },
    );
  } catch {
    return null;
  }
}

export interface CheckAppAccountOptions extends ApiFetchOptions {
  cookieHeader?: string;
}

/**
 * Check whether the authenticated viewer has an account on a given app.
 * Returns `null` on any error.
 */
export async function checkAppAccount(
  config: SifaApiConfig,
  appId: string,
  options: CheckAppAccountOptions = {},
): Promise<AccountCheckResult | null> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    return await apiFetch<AccountCheckResult>(
      config,
      `/api/reactions/account-check/${encodeURIComponent(appId)}`,
      {
        credentials: 'include',
        ...options,
        headers,
      },
    );
  } catch {
    return null;
  }
}
