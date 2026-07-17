import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/**
 * What the server managed to remove from the user's PDS.
 *
 * The wipe runs per collection, so it can partly succeed: `success: true` means
 * the account action completed, NOT that the PDS is clean. A UI that ignores
 * this can tell someone their data is gone while it is still on their data
 * server, so treat a non-empty `remaining` as "not deleted".
 *
 * Absent when the PDS was not touched (`deletePdsData: false`).
 */
export interface PdsWipeOutcome {
  /** Collections whose records were removed. */
  deleted: string[];
  /** Collections whose records are still on the PDS. Non-empty means not done. */
  remaining: string[];
  /**
   * The server could not enumerate the repo, so it does not know what survived.
   * Without this, that case is indistinguishable from "nothing to delete".
   */
  unknown: boolean;
}

/** Extended write result for {@link resetProfile}. */
export interface ResetProfileResult extends WriteResult {
  /** Present when `deletePdsData: true`. See {@link PdsWipeOutcome}. */
  pds?: PdsWipeOutcome;
}

/** Extended write result for {@link deleteAccount}. */
export interface DeleteAccountResult extends WriteResult {
  /** The deleted handle, returned by the server for confirmation UIs. */
  handle?: string;
  /** Present when `deletePdsData: true`. See {@link PdsWipeOutcome}. */
  pds?: PdsWipeOutcome;
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
): Promise<ResetProfileResult> {
  return apiWrite<{ ok?: boolean; pds?: PdsWipeOutcome }>(config, '/api/profile/reset', 'DELETE', {
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
  return apiWrite<{ ok?: boolean; handle?: string; pds?: PdsWipeOutcome }>(
    config,
    '/api/profile/account',
    'DELETE',
    {
      body: { deletePdsData },
      ...options,
    },
  );
}
