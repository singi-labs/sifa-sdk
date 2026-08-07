import { PROFILE_INVESTMENT_NSID } from '../../schemas/profile-investment.js';
import { createRecord, updateRecord, deleteRecord } from './records.js';
import type { ApiFetchOptions, CreateResult, SifaApiConfig, WriteResult } from '../client.js';

export type { CreateResult, WriteResult } from '../client.js';

/**
 * Typed wrappers over the generic record routes for
 * `id.sifa.profile.investment`. sifa-api serves every collection without a
 * bespoke handler through `POST|PUT|DELETE /api/profile/records/<collection>`,
 * so these exist for call-site readability, not for a different endpoint.
 *
 * Never throw -- inspect `result.success` and use `result.error` /
 * `result.pdsHost` for UI messaging.
 */
export function createInvestment(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return createRecord(config, PROFILE_INVESTMENT_NSID, data, options);
}

/** Update an existing investment by `rkey`. */
export function updateInvestment(
  config: SifaApiConfig,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return updateRecord(config, PROFILE_INVESTMENT_NSID, rkey, data, options);
}

/** Delete an investment by `rkey`. */
export function deleteInvestment(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return deleteRecord(config, PROFILE_INVESTMENT_NSID, rkey, options);
}
