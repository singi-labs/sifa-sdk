import type { ProfileView } from '../../types/profile-view.js';
import {
  ApiError,
  apiFetch,
  encodeIdentifier,
  type ApiFetchOptions,
  type SifaApiConfig,
} from '../client.js';

/**
 * Read the aggregated public profile view via the `id.sifa.getProfileView`
 * XRPC query. This is the AppView-only join (positions, education, skills,
 * endorsements, and more) exposed as a standard lexicon method, distinct from
 * the internal `/api/profile/*` REST surface.
 *
 * Returns `null` when the AppView has no profile for the actor
 * (`ProfileNotFound`). Throws {@link ApiError} on other non-2xx responses.
 *
 * Server-callable (Next.js RSC) and client-callable (Expo, browser).
 */
export async function fetchGetProfileView(
  config: SifaApiConfig,
  actor: string,
  options: ApiFetchOptions = {},
): Promise<ProfileView | null> {
  const path = `/xrpc/id.sifa.getProfileView?actor=${encodeIdentifier(actor)}`;
  try {
    return await apiFetch<ProfileView>(config, path, { retryOn429: true, ...options });
  } catch (e) {
    if (
      e instanceof ApiError &&
      e.status === 400 &&
      typeof e.body === 'object' &&
      e.body !== null &&
      (e.body as { error?: unknown }).error === 'ProfileNotFound'
    ) {
      return null;
    }
    throw e;
  }
}
