'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import type { WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import { submitOrgClaim, type OrgClaimResult } from '../fetchers/org.js';
import type { OrgClaimRequestInput } from '../../schemas/write/org-claim.js';
import { sifaQueryKeys } from '../keys.js';

type OrgClaimMutationResult = WriteResult & Partial<OrgClaimResult>;

/**
 * Finalize an org profile claim (`POST /api/org/claim`). Pass the org's
 * handle/DID so the profile cache (which carries the org floor verdict) is
 * invalidated on success; pass `null` to skip invalidation.
 */
export function useOrgClaim(
  handleOrDid: string | null,
  options?: Omit<
    UseMutationOptions<OrgClaimMutationResult, Error, OrgClaimRequestInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OrgClaimRequestInput) => submitOrgClaim(config, body),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success && handleOrDid) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.profile.byHandle(handleOrDid),
        });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
