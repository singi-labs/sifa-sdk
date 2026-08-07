import {
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

export type { CreateResult, WriteResult } from '../client.js';

/**
 * Create a new `id.sifa.profile.investment` record on the authenticated user's PDS.
 * The AppView signs and writes via the user's OAuth session.
 *
 * `data` should be a lexicon-shaped investment record (without `createdAt` or
 * `rkey`; the AppView fills both). Validate with `InvestmentWriteSchema` first if
 * you want client-side guarantees.
 *
 * Never throws -- inspect `result.success` and use `result.error` / `result.pdsHost`
 * for UI messaging.
 */
export function createInvestment(
  config: SifaApiConfig,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<CreateResult> {
  return apiWriteCreate(config, '/api/profile/investment', data, options);
}

/** Update an existing investment by `rkey`. */
export function updateInvestment(
  config: SifaApiConfig,
  rkey: string,
  data: Record<string, unknown>,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/investment/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete an investment by `rkey`. */
export function deleteInvestment(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/investment/${encodeURIComponent(rkey)}`, 'DELETE', options);
}
