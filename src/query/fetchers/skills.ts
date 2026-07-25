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

/** Outcome of a bulk sub-category assign. */
export interface SubCategoryBulkResult {
  /** Records written. */
  updated: number;
  /** Records that already carried the label, so no write was needed. */
  unchanged: number;
  /** Requested rkeys with no matching record on the PDS. */
  skipped: string[];
}

/**
 * Set (or clear) the sub-category on many skills in one request.
 *
 * A single call replaces one PUT per skill, which tripped the AppView's
 * per-IP rate limit on any sizeable profile (#324). An empty `subCategory`
 * clears the field.
 */
export function updateSkillSubCategories(
  config: SifaApiConfig,
  rkeys: string[],
  subCategory: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult & SubCategoryBulkResult> {
  return apiWrite<SubCategoryBulkResult>(config, '/api/profile/skills/subcategory', 'POST', {
    body: { rkeys, subCategory },
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
