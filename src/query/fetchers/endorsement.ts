import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Counts confirmed endorsements received by a DID. The backend's
 * `GET /api/endorsement/:did` already returns only confirmed endorsements
 * (via inner join with `endorsementConfirmations`), so this helper just
 * returns the array length. Failures return 0 so callers can route safely.
 *
 * Public endpoint -- no credentials needed.
 */
export async function fetchEndorsementCount(
  config: SifaApiConfig,
  did: string,
  options: ApiFetchOptions = {},
): Promise<number> {
  const path = `/api/endorsement/${encodeURIComponent(did)}`;
  try {
    const data = await apiFetch<unknown>(config, path, {
      cache: 'no-store',
      timeoutMs: 5000,
      ...options,
    });
    if (typeof data !== 'object' || data === null || !('endorsements' in data)) {
      return 0;
    }
    const endorsements = data.endorsements;
    return Array.isArray(endorsements) ? endorsements.length : 0;
  } catch {
    return 0;
  }
}
