import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** Result returned by record-write mutations (create / update / delete). */
export interface WriteResult {
  success: boolean;
  error?: string;
  pdsHost?: string;
}

/** Result returned by create mutations. Includes the newly created `rkey`. */
export interface CreateResult extends WriteResult {
  rkey?: string;
}

/**
 * Create a new `id.sifa.profile.position` record on the authenticated
 * user's PDS. The AppView signs and writes via the user's OAuth session.
 *
 * `data` should be a lexicon-shaped position record (without `createdAt`
 * or `rkey`; the AppView fills both). Validate with
 * `ProfilePositionRecordSchema.omit({ createdAt: true })` before calling
 * if you want client-side guarantees.
 */
export function createPosition(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiFetch<CreateResult>(config, '/api/positions', {
    method: 'POST',
    body: data,
    credentials: 'include',
    ...options,
  });
}
