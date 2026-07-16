'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  requestOrgDomainChallenge,
  verifyOrgDomain,
  type OrgDomainChallengeResult,
  type OrgDomainVerifyResult,
} from '../fetchers/org.js';
import type {
  OrgDomainChallengeRequestInput,
  OrgDomainVerifyRequestInput,
} from '../../schemas/write/org-settings.js';

type OrgDomainChallengeMutationResult = WriteResult & Partial<OrgDomainChallengeResult>;
type OrgDomainVerifyMutationResult = WriteResult & Partial<OrgDomainVerifyResult>;

/**
 * Issue a one-time DNS TXT domain challenge (`POST /api/org/domains/challenge`).
 * The result carries the TXT record name + value for the org to publish.
 */
export function useOrgDomainChallenge(
  options?: Omit<
    UseMutationOptions<OrgDomainChallengeMutationResult, Error, OrgDomainChallengeRequestInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (body: OrgDomainChallengeRequestInput) => requestOrgDomainChallenge(config, body),
    ...options,
  });
}

/**
 * Verify a DNS TXT domain challenge (`POST /api/org/domains/verify`). On success
 * `status` is `verified` or `pending`; other outcomes surface as
 * `{ success: false }`.
 */
export function useOrgDomainVerify(
  options?: Omit<
    UseMutationOptions<OrgDomainVerifyMutationResult, Error, OrgDomainVerifyRequestInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (body: OrgDomainVerifyRequestInput) => verifyOrgDomain(config, body),
    ...options,
  });
}
