import { apiWrite, type ApiFetchOptions, type SifaApiConfig, type WriteResult } from '../client.js';
import type { OrgClaimRequestInput } from '../../schemas/write/org-claim.js';
import type {
  OrgDomainChallengeRequestInput,
  OrgDomainVerifyRequestInput,
  OrgNotificationEmailRequestInput,
  OrgProfileUpdateRequestInput,
} from '../../schemas/write/org-settings.js';

/** How a single entity binding was resolved during a claim. */
export interface OrgClaimBinding {
  entityId: number;
  entityRef: string;
  validatedBy: string | null;
  status: 'active' | 'pending';
  dissolved: boolean;
}

/** The public org-profile echo returned by claim / update endpoints (no `contact`). */
export interface OrgProfileEcho {
  name: string;
  description: string | null;
  website: string | null;
  entityRefs: string[];
}

/** Response body of `POST /api/org/claim`. */
export interface OrgClaimResult {
  orgDid: string;
  status: 'active' | 'review';
  bindings: OrgClaimBinding[];
  orgProfile: OrgProfileEcho;
}

/** Response body of `PUT /api/org/profile`. */
export interface OrgProfileUpdateResult {
  ok: boolean;
  orgProfile: OrgProfileEcho;
}

/** Response body of `POST /api/org/domains/challenge`. */
export interface OrgDomainChallengeResult {
  domain: string;
  txtRecordName: string;
  txtRecordValue: string;
}

/** Response body of `POST /api/org/domains/verify` (happy path). */
export interface OrgDomainVerifyResult {
  status: 'verified' | 'pending';
  domain: string;
}

/** Response body of `POST /api/org/notification-emails`. */
export interface OrgNotificationEmailAddResult {
  ok: boolean;
  status: string;
}

/** Response body of `DELETE /api/org/notification-emails`. */
export interface OrgNotificationEmailRemoveResult {
  ok: boolean;
  removed: number;
}

/**
 * Finalize an org profile claim (`POST /api/org/claim`). Auth-gated (org-claim
 * JIT scope) and floor-checked server-side. Never throws -- returns the
 * structured {@link OrgClaimResult} folded into a {@link WriteResult} on success,
 * or `{ success: false, error, pdsHost? }` on failure.
 */
export function submitOrgClaim(
  config: SifaApiConfig,
  body: OrgClaimRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgClaimResult>> {
  return apiWrite<Partial<OrgClaimResult>>(config, '/api/org/claim', 'POST', { body, ...options });
}

/**
 * Edit the org record (`PUT /api/org/profile`). Fresh-from-body server-side PUT
 * (a cleared optional field is dropped, no spread-merge). Never throws.
 */
export function updateOrgProfile(
  config: SifaApiConfig,
  body: OrgProfileUpdateRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgProfileUpdateResult>> {
  return apiWrite<Partial<OrgProfileUpdateResult>>(config, '/api/org/profile', 'PUT', {
    body,
    ...options,
  });
}

/**
 * Issue a one-time DNS TXT domain challenge (`POST /api/org/domains/challenge`).
 * Returns the TXT record name + value the org must publish. Never throws.
 */
export function requestOrgDomainChallenge(
  config: SifaApiConfig,
  body: OrgDomainChallengeRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgDomainChallengeResult>> {
  return apiWrite<Partial<OrgDomainChallengeResult>>(config, '/api/org/domains/challenge', 'POST', {
    body,
    ...options,
  });
}

/**
 * Verify a DNS TXT domain challenge (`POST /api/org/domains/verify`). On success
 * `status` is `verified` or `pending`. Expired / confusable / not-found map to
 * non-2xx server responses and surface as `{ success: false, error }`. Never
 * throws.
 */
export function verifyOrgDomain(
  config: SifaApiConfig,
  body: OrgDomainVerifyRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgDomainVerifyResult>> {
  return apiWrite<Partial<OrgDomainVerifyResult>>(config, '/api/org/domains/verify', 'POST', {
    body,
    ...options,
  });
}

/**
 * Add an org notification email (`POST /api/org/notification-emails`). The
 * address must use a domain the org controls (checked server-side). An
 * individual verification email is enqueued through the (dormant) sending
 * pipeline. Never throws.
 */
export function addOrgNotificationEmail(
  config: SifaApiConfig,
  body: OrgNotificationEmailRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgNotificationEmailAddResult>> {
  return apiWrite<Partial<OrgNotificationEmailAddResult>>(
    config,
    '/api/org/notification-emails',
    'POST',
    { body, ...options },
  );
}

/**
 * Remove an org notification email (`DELETE /api/org/notification-emails`).
 * Never throws.
 */
export function removeOrgNotificationEmail(
  config: SifaApiConfig,
  body: OrgNotificationEmailRequestInput,
  options: Omit<ApiFetchOptions, 'method' | 'body'> = {},
): Promise<WriteResult & Partial<OrgNotificationEmailRemoveResult>> {
  return apiWrite<Partial<OrgNotificationEmailRemoveResult>>(
    config,
    '/api/org/notification-emails',
    'DELETE',
    { body, ...options },
  );
}
