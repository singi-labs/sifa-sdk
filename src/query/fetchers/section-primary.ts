import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/**
 * Profile sections that support a user-chosen primary item feeding the Highlights
 * block. `position` is excluded: it predates this and keeps its own dedicated
 * endpoint (`setPositionPrimary` / `unsetPositionPrimary` in `positions.ts`).
 */
export type PrimarySection =
  'education' | 'publication' | 'presentation' | 'involvement' | 'project';

/**
 * Mark a section record as the user's primary item for that section. The AppView
 * flips `isPrimary` on the record via the user's OAuth session, clears the flag on
 * any sibling in the same section, and enforces the per-section eligibility rule.
 *
 * Never throws: inspect `result.success` and use `result.error` for UI messaging.
 */
export function setSectionPrimary(
  config: SifaApiConfig,
  section: PrimarySection,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/${section}/${encodeURIComponent(rkey)}/primary`,
    'PUT',
    options,
  );
}

/** Clear the primary flag on a section record. */
export function unsetSectionPrimary(
  config: SifaApiConfig,
  section: PrimarySection,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/${section}/${encodeURIComponent(rkey)}/primary`,
    'DELETE',
    options,
  );
}
