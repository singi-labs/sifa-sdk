import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/** Industry/domain entry on the profile self record. */
export interface ProfileIndustryInput {
  industry: string;
  domain?: string;
}

/**
 * Location payload accepted by `updateProfileSelf`.
 *
 * Accepts both shapes during the community.lexicon.location.address
 * migration. Prefer `locality` (new) over `city` (legacy) when sending.
 * The API's locationSchema is a Zod union that resolves either input.
 */
export interface ProfileSelfLocation {
  country: string;
  countryCode?: string;
  region?: string;
  city?: string;
  locality?: string;
}

/** Body accepted by {@link updateProfileSelf}. */
export interface UpdateProfileSelfInput {
  headline?: string;
  about?: string;
  /** Schema.org Person.givenName from id.sifa.profile.self.givenName. */
  givenName?: string;
  /** Schema.org Person.familyName from id.sifa.profile.self.familyName. */
  familyName?: string;
  /** Free-form phonetic respelling of the name from id.sifa.profile.self.namePronunciation. */
  namePronunciation?: string;
  industries?: ProfileIndustryInput[];
  location?: ProfileSelfLocation;
  website?: string;
  openTo?: string[];
  preferredWorkplace?: string[];
  availableFromUtc?: number;
  availableToUtc?: number;
}

/** Update the authenticated user's `id.sifa.profile.self` record. */
export function updateProfileSelf(
  config: SifaApiConfig,
  data: UpdateProfileSelfInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/self', 'PUT', { body: data, ...options });
}

/** Body accepted by {@link updateProfileOverride}. */
export interface UpdateProfileOverrideInput {
  headline?: string | null;
  about?: string | null;
  displayName?: string | null;
  pronouns?: string | null;
}

/**
 * Override aggregated profile fields with sifa-specific values. `null`
 * clears the override and falls back to the upstream PDS value.
 */
export function updateProfileOverride(
  config: SifaApiConfig,
  data: UpdateProfileOverrideInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/override', 'PUT', { body: data, ...options });
}

/** Extended result for {@link refreshPds}. */
export interface RefreshPdsResult extends WriteResult {
  displayName?: string | null;
  avatar?: string | null;
}

/**
 * Re-pull the authenticated user's `app.bsky.actor.profile` from their
 * PDS. Returns the freshly resolved `displayName` and `avatar` on
 * success so the UI can update without a full profile refetch.
 */
export function refreshPds(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<RefreshPdsResult> {
  return apiWrite<{ displayName?: string | null; avatar?: string | null }>(
    config,
    '/api/profile/refresh-pds',
    'POST',
    options,
  );
}

/** Extended result for {@link uploadAvatar}. */
export interface UploadAvatarResult extends WriteResult {
  /** Publicly accessible URL of the newly uploaded avatar. */
  url?: string;
}

/**
 * Upload a new avatar via `multipart/form-data`. Pass either a `File`
 * (browser) or any `Blob` (Expo, node). The SDK leaves `Content-Type`
 * unset so the runtime can set the multipart boundary automatically.
 *
 * Never throws -- inspect `result.success` and `result.url`.
 */
export async function uploadAvatar(
  config: SifaApiConfig,
  file: Blob,
  options: ApiFetchOptions = {},
): Promise<UploadAvatarResult> {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const url = `${config.baseUrl}/api/profile/avatar`;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      credentials: options.credentials ?? 'include',
      body: formData,
      signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? 30_000),
      headers: options.headers,
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as {
        message?: string;
        pdsHost?: string;
      };
      const msg = errBody.message ?? `Request failed (${res.status})`;
      const pdsHost = errBody.pdsHost;
      return { success: false, error: msg, ...(pdsHost ? { pdsHost } : {}) };
    }
    const data = (await res.json()) as { url: string };
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

/** Delete the authenticated user's avatar override (revert to PDS avatar). */
export function deleteAvatarOverride(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/avatar', 'DELETE', options);
}
