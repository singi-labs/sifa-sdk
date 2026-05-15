import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

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

/** Result of a successful {@link createReaction}. */
export interface ReactionResult {
  uri: string;
  rkey: string;
}

/** Structured error returned by {@link createReaction} on failure. */
export interface ReactionError {
  type: 'scope_insufficient' | 'error';
  /** When `type === 'scope_insufficient'`, the lexicon scope the user must re-authorize for. */
  requiredScope?: string;
}

/**
 * Create a reaction (like / star) on a target ATproto record.
 *
 * Returns a discriminated-union result instead of the generic
 * {@link WriteResult} shape because reactions have a distinct
 * "scope insufficient" failure that callers handle differently from
 * other errors (it triggers an OAuth scope-upgrade flow rather than
 * an error toast).
 *
 * Never throws.
 */
export async function createReaction(
  config: SifaApiConfig,
  targetUri: string,
  appId: string,
  targetCid?: string,
  options: ApiFetchOptions = {},
): Promise<{ ok: true; data: ReactionResult } | { ok: false; error: ReactionError }> {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const url = `${config.baseUrl}/api/reactions`;

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      credentials: options.credentials ?? 'include',
      body: JSON.stringify({ targetUri, appId, targetCid }),
      signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });

    if (!res.ok) {
      if (res.status === 403) {
        try {
          const body = (await res.json()) as { error?: string; requiredScope?: string };
          if (body.error === 'ScopeInsufficient') {
            return {
              ok: false,
              error: { type: 'scope_insufficient', requiredScope: body.requiredScope },
            };
          }
        } catch {
          // Fall through to generic error
        }
      }
      return { ok: false, error: { type: 'error' } };
    }

    const data = (await res.json()) as ReactionResult;
    return { ok: true, data };
  } catch {
    return { ok: false, error: { type: 'error' } };
  }
}

/**
 * Delete a reaction (like / star) on a target ATproto record. Returns
 * `{ success: true }` on 2xx, `{ success: false, error }` on failure.
 */
export function deleteReaction(
  config: SifaApiConfig,
  targetUri: string,
  appId: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/reactions', 'DELETE', {
    body: { targetUri, appId },
    ...options,
  });
}
