import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/**
 * Make a Marque-registered domain public in the owner's Links section. Marque
 * domains are owner-only by default; this reveals one. `domain` is the
 * at.marque.domain rkey (the domain name itself).
 */
export function revealMarqueDomain(
  config: SifaApiConfig,
  domain: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/marque-domains/${encodeURIComponent(domain)}/reveal`,
    'POST',
    options,
  );
}

/** Make a previously-revealed Marque domain owner-only again. */
export function unrevealMarqueDomain(
  config: SifaApiConfig,
  domain: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/marque-domains/${encodeURIComponent(domain)}/reveal`,
    'DELETE',
    options,
  );
}
