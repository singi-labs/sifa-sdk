import type { RepoDeleteResult, RepoInventory } from '../../repo/types.js';
import { apiFetch, apiWrite, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Read what the user's PDS actually holds under id.sifa.*.
 *
 * A failure is not flattened into an empty inventory. Zero records reads as
 * "Sifa has stored nothing about you", and a request that never arrived must
 * not be allowed to say that. Let it throw.
 */
export function fetchRepoInventory(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<RepoInventory> {
  return apiFetch<RepoInventory>(config, '/api/me/repo-inventory', {
    credentials: 'include',
    ...options,
  });
}

export interface RepoDeleteInput {
  collection: string;
  /** The records to remove. Omit and set `all` to remove the whole collection. */
  rkeys?: string[];
  /**
   * Remove every record in the collection, including ones written between the
   * inventory read and this call. A UI offering "delete all of X" must send
   * this rather than the rkeys it happened to see, or a record created in
   * between silently survives a delete the user believes was complete.
   */
  all?: boolean;
}

/**
 * Delete records from the user's own repo.
 *
 * The returned `success` means the request was accepted, NOT that the records
 * are gone: read `results` for that, per record. `needsScopeUpgrade` means
 * nothing was attempted and the user has to grant the scope first.
 *
 * Destructive and not undoable -- a deleted record's CID cannot be restored.
 * The server enforces the id.sifa.* boundary and the session check; the SDK
 * adds no confirmation step, so wrap call sites in one.
 */
export function deleteRepoRecords(
  config: SifaApiConfig,
  input: RepoDeleteInput,
  options: ApiFetchOptions = {},
): Promise<RepoDeleteResult & { success: boolean; error?: string }> {
  return apiWrite<RepoDeleteResult>(config, '/api/me/repo-delete', 'POST', {
    body: input,
    ...options,
  });
}

/**
 * URL of the raw-record download.
 *
 * A URL rather than a fetcher: the response is a file the browser saves, and
 * routing it through fetch would buffer the whole repo in memory to hand it
 * straight back to a download anchor.
 */
export function repoExportUrl(config: SifaApiConfig): string {
  return `${config.baseUrl}/api/me/repo-export`;
}
