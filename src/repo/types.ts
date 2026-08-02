import type { RepoGroupId } from './groups.js';
import type { RepoRecordLabel } from './labels.js';

/** One record in the user's repo, reduced to what a management UI needs. */
export interface RepoRecordSummary {
  /** Full AT-URI, the stable identity of the record. */
  uri: string;
  /** Record key, the part a delete request names. */
  rkey: string;
  collection: string;
  label: RepoRecordLabel;
  /** When the record was written, from its own `createdAt`. Absent if it has none. */
  createdAt?: string;
}

/** One bucket of the inventory. Buckets the user has no records in are omitted. */
export interface RepoCollectionGroup {
  id: RepoGroupId;
  /** Collections in this bucket the user actually has records in. */
  collections: string[];
  recordCount: number;
  records: RepoRecordSummary[];
}

/**
 * What is in the user's repo under id.sifa.*, as their PDS reports it.
 *
 * Read from the PDS rather than the AppView. This is the one surface whose
 * entire purpose is to say what the user owns, so an index that has drifted --
 * lagging the firehose, or holding records deleted elsewhere -- would be
 * lying about the thing the page exists to answer.
 */
export interface RepoInventory {
  did: string;
  /** When the PDS was read, so a UI can say how fresh this is. */
  fetchedAt: string;
  groups: RepoCollectionGroup[];
  totalRecords: number;
  /**
   * Collections found in the repo that could not be listed. Their records are
   * missing from `groups`, so a UI must not present the inventory as complete.
   */
  unreadableCollections?: string[];
}

/** What happened to one record in a delete request. */
export type RepoDeleteOutcome =
  /** The PDS confirmed the record is gone. */
  | 'deleted'
  /** The delete was attempted and the record is still there. */
  | 'remaining'
  /** We could not establish either way. Not the same as `remaining`, and never success. */
  | 'unknown';

export interface RepoDeleteRecordResult {
  rkey: string;
  outcome: RepoDeleteOutcome;
}

/**
 * Result of a delete request.
 *
 * Carries no success flag of its own. The transport adds one meaning "the
 * request was accepted", which is not the same question: a request can be
 * accepted and still leave four of five records in place. What actually
 * happened to the data is in `results`, per record, and callers report that.
 */
export interface RepoDeleteResult {
  collection: string;
  results: RepoDeleteRecordResult[];
  /**
   * Set when the current OAuth grant cannot delete this collection, in which
   * case nothing was attempted. `scope` is the value to request.
   *
   * Present instead of a failure so a UI sends the user to consent rather than
   * telling them the delete failed for no stated reason.
   */
  needsScopeUpgrade?: { scope: string; collections: string[] };
}
