import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Create a new `id.sifa.profile.skill` record on the authenticated
 * user's PDS.
 */
export function createSkill(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/skill', data, options);
}

/** Update an existing skill record by `rkey`. */
export function updateSkill(
  config: SifaApiConfig,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/skill/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete a skill record by `rkey`. */
export function deleteSkill(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/skill/${encodeURIComponent(rkey)}`, 'DELETE', options);
}
