import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * The org-bearing profile collections other than positions whose records can
 * carry an unlinked organization. Positions have their own provider
 * ({@link fetchUnlinkedPositions}).
 */
export type UnlinkedRecordCollection =
  | 'id.sifa.profile.education'
  | 'id.sifa.profile.certification'
  | 'id.sifa.profile.volunteering'
  | 'id.sifa.profile.course'
  | 'id.sifa.profile.honor'
  | 'id.sifa.profile.involvement';

/**
 * A record on the signed-in user's own profile (education, certification,
 * volunteering, course, award or involvement) whose free-text organization is
 * not yet linked to a canonical organization entity.
 */
export interface UnlinkedRecord {
  /** Collection NSID of the record, for routing to the right profile section. */
  collection: UnlinkedRecordCollection;
  /** rkey of the record, for deep-linking to its editor. */
  rkey: string;
  /** AT-URI of the record. */
  uri: string;
  /** The free-text organization label the user entered. */
  organization: string;
  /** What the record is (degree, award title, role, ...). Absent when empty. */
  title?: string;
}

export interface UnlinkedRecordsResult {
  records: UnlinkedRecord[];
}

export interface FetchUnlinkedRecordsOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Records on the signed-in user's profile with an unlinked organization, an
 * "open task" surfaced in the unified Inbox. Requires credentials -- the
 * AppView reads the owner from the session. Returns an empty list on any
 * failure so a broken list degrades to "nothing to link" rather than breaking
 * the hosting surface.
 */
export async function fetchUnlinkedRecords(
  config: SifaApiConfig,
  options: FetchUnlinkedRecordsOptions = {},
): Promise<UnlinkedRecordsResult> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  try {
    const data = await apiFetch<UnlinkedRecordsResult>(config, '/api/profile/unlinked-records', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    return { records: Array.isArray(data?.records) ? data.records : [] };
  } catch {
    return { records: [] };
  }
}

/** Body accepted by {@link dismissUnlinkedRecord}. */
export interface DismissUnlinkedRecordInput {
  collection: UnlinkedRecordCollection;
  /** rkey of the record whose unlinked-organization task to dismiss. */
  rkey: string;
}

/**
 * Dismiss the unlinked-organization task for one record. Writes nothing to any
 * PDS; it stops the record reappearing in the Inbox (and drops it from the bell
 * count) when there is no organization entity worth linking.
 */
export function dismissUnlinkedRecord(
  config: SifaApiConfig,
  data: DismissUnlinkedRecordInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, '/api/profile/unlinked-records/dismiss', 'POST', {
    body: data,
    ...options,
  });
}
