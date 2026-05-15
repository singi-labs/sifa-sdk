import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/** Extended write result for {@link deleteAccount}. */
export interface DeleteAccountResult extends WriteResult {
  /** The deleted handle, returned by the server for confirmation UIs. */
  handle?: string;
}

/**
 * Reset the authenticated user's Sifa profile.
 *
 * `deletePdsData: true` also deletes the corresponding records on the
 * user's PDS. `deletePdsData: false` only removes the AppView's
 * indexed state -- the records on the PDS are left intact and could be
 * re-indexed later.
 *
 * Destructive. Server enforces session check + attestation; the SDK
 * does not gate on additional confirmation. Wrap call sites in your
 * own modal if you want a UX confirmation step.
 */
export function resetProfile(
  config: SifaApiConfig,
  deletePdsData: boolean,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/reset', 'DELETE', {
    body: { deletePdsData },
    ...options,
  });
}

/**
 * Delete the authenticated user's account. Returns the deleted handle
 * on success (used by the post-delete confirmation screen).
 *
 * `deletePdsData: true` also deletes the corresponding records on the
 * user's PDS; `false` leaves the PDS records intact.
 *
 * Destructive. Same caveat as {@link resetProfile}.
 */
export function deleteAccount(
  config: SifaApiConfig,
  deletePdsData: boolean,
  options: ApiFetchOptions = {},
): Promise<DeleteAccountResult> {
  return apiWrite<{ ok?: boolean; handle?: string }>(config, '/api/profile/account', 'DELETE', {
    body: { deletePdsData },
    ...options,
  });
}
