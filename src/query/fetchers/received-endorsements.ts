import { encodeIdentifier, apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

export interface ReceivedEndorsement {
  endorserDid: string;
  /** Absent when the endorser has no Sifa profile yet. */
  endorserHandle?: string;
  endorserDisplayName?: string;
  endorserAvatar?: string;
  skillUri?: string;
  skillCid?: string;
  skillName: string;
  comment?: string;
  createdAt: string;
}

export interface ReceivedEndorsementsPage {
  endorsements: ReceivedEndorsement[];
  cursor?: string;
}

/**
 * Confirmed endorsements a DID has received, newest first.
 *
 * Only confirmed ones exist here: the AppView inner-joins against the
 * confirmation records, so an endorsement the subject has not accepted is
 * absent rather than pending. Public -- no credentials needed.
 *
 * Returns an empty page on failure so a surface that merely decorates a page
 * cannot break it.
 */
export async function fetchReceivedEndorsements(
  config: SifaApiConfig,
  did: string,
  options: { limit?: number } & ApiFetchOptions = {},
): Promise<ReceivedEndorsementsPage> {
  const { limit, ...fetchOptions } = options;
  const qs = limit ? `?limit=${limit}` : '';
  try {
    const data = await apiFetch<ReceivedEndorsementsPage>(
      config,
      `/api/endorsement/${encodeIdentifier(did)}${qs}`,
      { cache: 'no-store', timeoutMs: 5000, ...fetchOptions },
    );
    return { endorsements: data?.endorsements ?? [], cursor: data?.cursor };
  } catch {
    return { endorsements: [] };
  }
}
