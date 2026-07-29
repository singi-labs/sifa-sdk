import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/** A received endorsement the subject has neither confirmed nor dismissed. */
export interface PendingEndorsement {
  endorserDid: string;
  /**
   * Endorser's handle, when the AppView has resolved one. Absent when the
   * endorser has no Sifa profile yet -- an endorsement can come from any AT
   * Protocol app -- so the UI needs a fallback for having no name to show.
   */
  endorserHandle?: string;
  rkey: string;
  /**
   * AT-URI of the endorsement record. The confirm mutation needs a strongRef,
   * so the AppView hands this back rather than making callers rebuild it.
   */
  uri: string;
  /**
   * CID of the endorsement record, when the AppView has it. Often absent:
   * an endorsement written by another AT Protocol app can be indexed without
   * its CID ever reaching us. Pass it through to confirm when present; the
   * AppView resolves it from the endorser's PDS when it is not.
   */
  cid?: string;
  skillUri: string;
  skillCid: string;
  skillName: string;
  comment?: string;
  createdAt: string;
}

export interface PendingEndorsementsPage {
  endorsements: PendingEndorsement[];
  cursor?: string;
}

/** Body accepted by {@link dismissEndorsement}. */
export interface DismissEndorsementInput {
  endorserDid: string;
  rkey: string;
}

/**
 * Endorsements awaiting the signed-in user's decision. Requires credentials --
 * the AppView reads the subject DID from the session, not from a parameter, so
 * there is no way to read someone else's inbox.
 *
 * Returns an empty page on failure so a broken inbox degrades to "nothing
 * pending" rather than breaking the surface hosting it.
 */
export async function fetchPendingEndorsements(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<PendingEndorsementsPage> {
  try {
    const data = await apiFetch<PendingEndorsementsPage>(config, '/api/endorsements/pending', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...options,
    });
    return { endorsements: data?.endorsements ?? [], cursor: data?.cursor };
  } catch {
    return { endorsements: [] };
  }
}

/**
 * Take a received endorsement out of the inbox.
 *
 * This writes nothing to any PDS. An endorsement only displays once the subject
 * has confirmed it, so declining is already the default state -- the dismissal
 * is a local flag that stops it reappearing, not a published rejection.
 */
export function dismissEndorsement(
  config: SifaApiConfig,
  data: DismissEndorsementInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/endorsement/dismiss', 'POST', { body: data, ...options });
}
