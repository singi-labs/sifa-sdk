import type { ExternalAccount } from '../../types/index.js';
import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/** Body accepted by {@link createExternalAccount} / {@link updateExternalAccount}. */
export interface ExternalAccountInput {
  platform: string;
  url: string;
  label?: string;
  feedUrl?: string;
}

/** Extended create result for {@link createExternalAccount}. */
export interface CreateExternalAccountResult extends WriteResult {
  rkey?: string;
  feedUrl?: string | null;
}

/** Extended write result for {@link verifyExternalAccount}. */
export interface VerifyExternalAccountResult extends WriteResult {
  verified?: boolean;
  verifiedVia?: string;
}

/** List external accounts attached to a profile. Returns `[]` on error. */
export async function fetchExternalAccounts(
  config: SifaApiConfig,
  handleOrDid: string,
  options: ApiFetchOptions = {},
): Promise<ExternalAccount[]> {
  const path = `/api/profile/${encodeURIComponent(handleOrDid)}/external-accounts`;
  try {
    const data = await apiFetch<{ accounts?: ExternalAccount[] }>(config, path, {
      credentials: 'include',
      ...options,
    });
    return data.accounts ?? [];
  } catch {
    return [];
  }
}

/**
 * Create a new external account record. Returns the newly-created `rkey`
 * and the server-resolved `feedUrl` (sifa-api inspects the target for
 * RSS feeds on platforms that publish them).
 */
export function createExternalAccount(
  config: SifaApiConfig,
  data: ExternalAccountInput,
  options: ApiFetchOptions = {},
): Promise<CreateExternalAccountResult> {
  return apiWrite<{ rkey?: string; feedUrl?: string | null }>(
    config,
    '/api/profile/external-accounts',
    'POST',
    { body: data, ...options },
  );
}

/** Update an existing external account by `rkey`. */
export function updateExternalAccount(
  config: SifaApiConfig,
  rkey: string,
  data: ExternalAccountInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile/external-accounts/${encodeURIComponent(rkey)}`, 'PUT', {
    body: data,
    ...options,
  });
}

/** Delete an external account by `rkey`. */
export function deleteExternalAccount(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/external-accounts/${encodeURIComponent(rkey)}`,
    'DELETE',
    options,
  );
}

/** Mark an external account as the user's primary. */
export function setExternalAccountPrimary(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/external-accounts/${encodeURIComponent(rkey)}/primary`,
    'PUT',
    options,
  );
}

/** Clear the "primary" flag on an external account. */
export function unsetExternalAccountPrimary(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/external-accounts/${encodeURIComponent(rkey)}/primary`,
    'DELETE',
    options,
  );
}

/**
 * Run server-side verification on an external account (e.g. inspect
 * the target for a keytrace claim). Returns `{ verified, verifiedVia }`
 * on success.
 */
export function verifyExternalAccount(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<VerifyExternalAccountResult> {
  return apiWrite<{ verified?: boolean; verifiedVia?: string }>(
    config,
    `/api/profile/external-accounts/${encodeURIComponent(rkey)}/verify`,
    'POST',
    { body: {}, ...options },
  );
}
