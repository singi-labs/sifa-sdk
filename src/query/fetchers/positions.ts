import {
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
} from '../client.js';

export type { CreateResult, WriteResult } from '../client.js';

/**
 * Create a new `id.sifa.profile.position` record on the authenticated
 * user's PDS. The AppView signs and writes via the user's OAuth session.
 *
 * `data` should be a lexicon-shaped position record (without `createdAt`
 * or `rkey`; the AppView fills both). Validate with
 * `ProfilePositionRecordSchema.omit({ createdAt: true })` before calling
 * if you want client-side guarantees.
 *
 * Never throws -- inspect `result.success` and use `result.error` /
 * `result.pdsHost` for UI messaging.
 */
export function createPosition(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/position', data, options);
}
