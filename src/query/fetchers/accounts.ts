import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** One account attached to the current browser, for the account switcher. */
export interface AccountSummary {
  did: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Whether this is the currently-active account. */
  active: boolean;
}

export interface FetchAccountsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Accounts attached to this browser (the account switcher). Requires an
 * authenticated session. Returns `[]` on any error, including the
 * unauthenticated case.
 */
export async function fetchAccounts(
  config: SifaApiConfig,
  options: FetchAccountsOptions = {},
): Promise<AccountSummary[]> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<{ accounts: AccountSummary[] }>(config, '/api/auth/accounts', {
      credentials: 'include',
      ...options,
      headers,
    });
    return data.accounts;
  } catch {
    return [];
  }
}

/**
 * Make an already-attached account the active one. Keyed by DID (public); the
 * server maps it to the browser's session id. Browser-only: the endpoint
 * requires an Origin header, which browsers set automatically on POST. Callers
 * typically reload the app afterwards to reset session-seeded state.
 */
export async function switchAccount(
  config: SifaApiConfig,
  did: string,
  options: ApiFetchOptions = {},
): Promise<void> {
  await apiFetch(config, '/oauth/switch', {
    method: 'POST',
    body: { did },
    credentials: 'include',
    ...options,
  });
}
