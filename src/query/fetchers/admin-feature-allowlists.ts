import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';
import type { FeatureAllowlistEntry, FeatureFlag } from '../../schemas/follow-profile.js';

/**
 * Options for {@link listFeatureAllowlist}. Supports the same `cookieHeader`
 * passthrough as the other admin reads for RSC contexts.
 */
export interface ListFeatureAllowlistOptions extends ApiFetchOptions {
  cookieHeader?: string;
}

/** Response shape of `GET /api/admin/feature-allowlists/:flag`. */
export interface FeatureAllowlistResponse {
  items: FeatureAllowlistEntry[];
}

/**
 * List all DIDs on the given feature flag's allowlist. Admin-gated server-
 * side (caller must be an admin). Returns an empty list on error so the UI
 * can render a graceful empty state.
 */
export async function listFeatureAllowlist(
  config: SifaApiConfig,
  flag: FeatureFlag,
  opts: ListFeatureAllowlistOptions = {},
): Promise<FeatureAllowlistResponse> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;
  try {
    const res = await apiFetch<{ items?: FeatureAllowlistEntry[] }>(
      config,
      `/api/admin/feature-allowlists/${encodeURIComponent(flag)}`,
      { credentials: 'include', cache: 'no-store', ...opts, headers },
    );
    return { items: res.items ?? [] };
  } catch {
    return { items: [] };
  }
}

/**
 * Add (or upsert the note for) a DID on the given flag's allowlist. Maps to
 * `POST /api/admin/feature-allowlists/{flag}`. Returns a {@link WriteResult};
 * never throws.
 */
export function addFeatureAllowlist(
  config: SifaApiConfig,
  flag: FeatureFlag,
  did: string,
  opts: { note?: string } & Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult> {
  const { note, ...rest } = opts;
  return apiWrite(config, `/api/admin/feature-allowlists/${encodeURIComponent(flag)}`, 'POST', {
    body: note !== undefined ? { did, note } : { did },
    ...rest,
  });
}

/**
 * Remove a DID from the given flag's allowlist. Maps to
 * `DELETE /api/admin/feature-allowlists/{flag}/{did}`. Returns a
 * {@link WriteResult}; never throws.
 */
export function removeFeatureAllowlist(
  config: SifaApiConfig,
  flag: FeatureFlag,
  did: string,
  opts: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/admin/feature-allowlists/${encodeURIComponent(flag)}/${encodeURIComponent(did)}`,
    'DELETE',
    opts,
  );
}
