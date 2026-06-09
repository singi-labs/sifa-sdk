import type { Profile } from '../../types/index.js';
import {
  encodeIdentifier,
  apiFetch,
  apiFetchOrNull,
  type ApiFetchOptions,
  type SifaApiConfig,
} from '../client.js';

/**
 * Read the aggregated profile for a handle or DID.
 *
 * Returns `null` when the AppView has no profile for the given identifier
 * (HTTP 404). Throws {@link ApiError} on other non-2xx responses.
 *
 * Server-callable (Next.js RSC) and client-callable (Expo, browser).
 */
export function fetchProfile(
  config: SifaApiConfig,
  handleOrDid: string,
  options: ApiFetchOptions = {},
): Promise<Profile | null> {
  const path = `/api/profile/${encodeIdentifier(handleOrDid)}`;
  return apiFetchOrNull<Profile>(config, path, {
    retryOn429: true,
    ...options,
  });
}

/**
 * Public AT Fund link for a profile, if one is configured. Returns `null`
 * on any error or when the response payload's `url` field is missing or
 * non-string.
 */
export async function fetchAtFundLink(
  config: SifaApiConfig,
  did: string,
  options: ApiFetchOptions = {},
): Promise<string | null> {
  const path = `/api/profiles/${encodeIdentifier(did)}/at-fund-link`;
  try {
    const data = await apiFetch<{ url?: unknown }>(config, path, {
      next: { revalidate: 3600 },
      timeoutMs: 5000,
      ...options,
    });
    return typeof data.url === 'string' ? data.url : null;
  } catch {
    return null;
  }
}
