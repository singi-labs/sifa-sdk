import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Create a new `id.sifa.profile.education` record on the authenticated
 * user's PDS.
 */
export function createEducation(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/education', data, options);
}

/** Update an existing education record by `rkey`. */
export function updateEducation(
  config: SifaApiConfig,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/education/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete an education record by `rkey`. */
export function deleteEducation(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/education/${encodeURIComponent(rkey)}`, 'DELETE', options);
}
