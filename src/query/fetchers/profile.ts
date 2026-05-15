import type { Profile } from '../../types/index.js';
import { apiFetchOrNull, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

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
  const path = `/api/profile/${encodeURIComponent(handleOrDid)}`;
  return apiFetchOrNull<Profile>(config, path, {
    retryOn429: true,
    ...options,
  });
}
