'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import type { WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import { updateOrgProfile, type OrgProfileUpdateResult } from '../fetchers/org.js';
import type { OrgProfileUpdateRequestInput } from '../../schemas/write/org-settings.js';
import { sifaQueryKeys } from '../keys.js';

type OrgProfileUpdateMutationResult = WriteResult & Partial<OrgProfileUpdateResult>;

/**
 * Edit the org record (`PUT /api/org/profile`). Pass the org's handle/DID to
 * invalidate the profile cache (org floor verdict + fields) on success.
 */
export function useUpdateOrgProfile(
  handleOrDid: string | null,
  options?: Omit<
    UseMutationOptions<OrgProfileUpdateMutationResult, Error, OrgProfileUpdateRequestInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (body: OrgProfileUpdateRequestInput) => updateOrgProfile(config, body),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success && handleOrDid) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.profile.byHandle(handleOrDid),
        });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
