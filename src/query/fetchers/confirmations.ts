import {
  apiFetch,
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/** A claim naming the signed-in user that they have neither confirmed nor dismissed. */
export interface PendingConfirmation {
  /** DID of the person who wrote the claim. */
  claimerDid: string;
  /**
   * Claimer's handle, when the AppView has resolved one. Absent when they have
   * no Sifa profile: a claim can be written by any AT Protocol app, so the UI
   * needs a fallback for having no name to show.
   */
  claimerHandle?: string;
  claimerDisplayName?: string;
  claimerAvatar?: string;
  /** AT-URI of the record that names you. The confirm mutation needs a strongRef. */
  subjectUri: string;
  /**
   * CID of that record, when the AppView has it. Often absent, since a record
   * indexed from another app can arrive without one. Pass it through when
   * present; the AppView resolves it from the claimer's PDS when it is not.
   * Never substitute a different record's CID.
   */
  subjectCid?: string;
  relation: string;
  /** Name or title the subject record carries right now, for display and snapshotting. */
  subjectName: string;
  /** Role the claimer assigned you, for `projectMember`. Display only. */
  role?: string;
  title?: string;
  createdAt: string;
}

export interface PendingConfirmationsPage {
  confirmations: PendingConfirmation[];
  cursor?: string;
}

/** Body accepted by {@link createConfirmation}. */
export interface ConfirmationInput {
  subjectUri: string;
  subjectCid?: string;
  relation: string;
  /**
   * Snapshot of the subject's name at confirmation time. Stored in your own
   * repo, out of the claimer's reach, so a later rename is detectable.
   */
  subjectName?: string;
}

/** Body accepted by {@link dismissConfirmation} and {@link revokeConfirmation}. */
export interface ConfirmationSubjectInput {
  subjectUri: string;
}

/**
 * Claims awaiting the signed-in user's decision. Requires credentials -- the
 * AppView reads the subject DID from the session, not from a parameter, so
 * there is no way to read someone else's inbox.
 *
 * Returns an empty page on failure so a broken inbox degrades to "nothing
 * pending" rather than breaking the surface hosting it.
 */
export async function fetchPendingConfirmations(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<PendingConfirmationsPage> {
  try {
    const data = await apiFetch<PendingConfirmationsPage>(config, '/api/confirmations/pending', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...options,
    });
    return { confirmations: data?.confirmations ?? [], cursor: data?.cursor };
  } catch {
    return { confirmations: [] };
  }
}

/**
 * Affirm that a record naming you is accurate, writing an `id.sifa.confirmation`
 * to your own PDS. Until this exists the claim renders as a bare handle with no
 * display name, avatar, or link back to you.
 *
 * Confirming does not put the claimer's record on your profile. That record
 * lives in their repository and they can rename it at will; keeping your own
 * entry is a separate, deliberate step.
 */
export function createConfirmation(
  config: SifaApiConfig,
  data: ConfirmationInput,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/confirmation', data, options);
}

/**
 * Take a claim out of the inbox without confirming it.
 *
 * This writes nothing to any PDS. A claim only gains your identity once you
 * have confirmed it, so declining is already the default state -- the dismissal
 * is a local flag that stops it reappearing, not a published rejection the
 * claimer can read.
 */
export function dismissConfirmation(
  config: SifaApiConfig,
  data: ConfirmationSubjectInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/confirmation/dismiss', 'POST', { body: data, ...options });
}

/**
 * Withdraw a confirmation you previously gave, deleting the record from your
 * PDS. The claim reverts to rendering as a bare handle.
 *
 * The usual reason is drift: the claimer renamed the project or changed the
 * role after you confirmed, so what you affirmed is no longer what is shown.
 * Also writes a dismissal, or the still-live claim returns to your inbox.
 */
export function revokeConfirmation(
  config: SifaApiConfig,
  data: ConfirmationSubjectInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/confirmation/revoke', 'POST', { body: data, ...options });
}
