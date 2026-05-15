import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/** Extended result for {@link refreshOrcidPublications}. */
export interface RefreshOrcidPublicationsResult extends WriteResult {
  added?: number;
  removed?: number;
}

/**
 * Hide an ORCID-imported publication from the user's profile. The
 * `putCode` is the ORCID-side identifier; the underlying record stays
 * in the index, only its display is suppressed.
 */
export function hideOrcidPublication(
  config: SifaApiConfig,
  putCode: number,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/orcid-publications/${putCode}/hide`, 'POST', options);
}

/** Restore a previously-hidden ORCID publication. */
export function unhideOrcidPublication(
  config: SifaApiConfig,
  putCode: number,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/orcid-publications/${putCode}/hide`, 'DELETE', options);
}

/** Hide a standard (auto-imported) publication by its AT URI. */
export function hideStandardPublication(
  config: SifaApiConfig,
  uri: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/standard-publications/${encodeURIComponent(uri)}/hide`,
    'POST',
    options,
  );
}

/** Restore a previously-hidden standard publication. */
export function unhideStandardPublication(
  config: SifaApiConfig,
  uri: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/standard-publications/${encodeURIComponent(uri)}/hide`,
    'DELETE',
    options,
  );
}

/** Bulk-hide standard publications by AT URI list. */
export function bulkHideStandardPublications(
  config: SifaApiConfig,
  uris: string[],
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/standard-publications/bulk-hide', 'POST', {
    body: { uris },
    ...options,
  });
}

/** Bulk-unhide standard publications by AT URI list. */
export function bulkUnhideStandardPublications(
  config: SifaApiConfig,
  uris: string[],
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/standard-publications/bulk-hide', 'DELETE', {
    body: { uris },
    ...options,
  });
}

/** Hide an `id.sifa.profile.publication` (user-authored publication record). */
export function hideSifaPublication(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/publications/${rkey}/hide`, 'POST', options);
}

/** Restore a previously-hidden Sifa publication. */
export function unhideSifaPublication(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/publications/${rkey}/hide`, 'DELETE', options);
}

/**
 * Re-pull the authenticated user's ORCID publications. Returns counts
 * of added and removed records. The server returns `{ error: '...' }`
 * inline (not via HTTP status) on quota / linkage failures; the SDK
 * folds that into `{ success: false, error }` to keep the contract
 * consistent with other mutations.
 */
export async function refreshOrcidPublications(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<RefreshOrcidPublicationsResult> {
  const result = await apiWrite<{ added?: number; removed?: number; error?: string }>(
    config,
    '/api/profile/orcid-publications/refresh',
    'POST',
    { body: {}, ...options },
  );
  if (result.success && result.error) {
    return { success: false, error: result.error };
  }
  return result;
}
