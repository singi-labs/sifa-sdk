import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Generic record-create escape hatch. Most callers should prefer the
 * dedicated section helpers (`createPosition`, `createEducation`, etc.)
 * which take typed payloads and ship matching hooks. Use this when the
 * lexicon doesn't yet have a dedicated endpoint (certifications,
 * projects, publications, volunteering, honors, languages, courses).
 *
 * `collection` is a `id.sifa.profile.*` collection NSID. Routes to
 * `POST /api/profile/records/<collection>`.
 */
export function createRecord(
  config: SifaApiConfig,
  collection: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(
    config,
    `/api/profile/records/${encodeURIComponent(collection)}`,
    data,
    options,
  );
}

/** Generic record-update escape hatch. See {@link createRecord}. */
export function updateRecord(
  config: SifaApiConfig,
  collection: string,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  const path = `/api/profile/records/${encodeURIComponent(collection)}/${encodeURIComponent(rkey)}`;
  return apiWrite(config, path, 'PUT', { body: data, ...options });
}

/** Generic record-delete escape hatch. See {@link createRecord}. */
export function deleteRecord(
  config: SifaApiConfig,
  collection: string,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  const path = `/api/profile/records/${encodeURIComponent(collection)}/${encodeURIComponent(rkey)}`;
  return apiWrite(config, path, 'DELETE', options);
}
