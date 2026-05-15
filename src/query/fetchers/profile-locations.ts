import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Address payload accepted by `/api/profile/location` endpoints.
 *
 * Accepts both shapes during the community.lexicon.location.address
 * migration. Prefer `country` + `locality` (new) over `countryCode` +
 * `city` (legacy). The API's `locationSchema` is a Zod union that
 * accepts either pair.
 */
export interface ProfileLocationAddress {
  /** Legacy alias for `country` (alpha-2). */
  countryCode?: string;
  /** community.lexicon.location.address field -- prefer over `countryCode`. */
  country?: string;
  region?: string;
  /** Legacy alias for `locality`. */
  city?: string;
  /** community.lexicon.location.address field -- prefer over `city`. */
  locality?: string;
}

/** Body accepted by {@link createProfileLocation} / {@link updateProfileLocation}. */
export interface ProfileLocationInput {
  address: ProfileLocationAddress;
  type: string;
  label?: string;
  isPrimary?: boolean;
}

/** Create a new profile location entry. */
export function createProfileLocation(
  config: SifaApiConfig,
  data: ProfileLocationInput,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/location', data, options);
}

/** Update an existing profile location by `rkey`. */
export function updateProfileLocation(
  config: SifaApiConfig,
  rkey: string,
  data: ProfileLocationInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/location/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete a profile location by `rkey`. */
export function deleteProfileLocation(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/location/${encodeURIComponent(rkey)}`, 'DELETE', options);
}
