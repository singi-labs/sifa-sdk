import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';

/**
 * Hide a keytrace claim (verified-account claim discovered on the
 * user's external accounts) from the user's profile. The claim itself
 * stays in the index; only its display is suppressed.
 */
export function hideKeytraceClaim(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/keytrace-claims/${encodeURIComponent(rkey)}/hide`,
    'POST',
    options,
  );
}

/** Restore a previously-hidden keytrace claim. */
export function unhideKeytraceClaim(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/profile/keytrace-claims/${encodeURIComponent(rkey)}/hide`,
    'DELETE',
    options,
  );
}
