'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type CreateResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import { createEndorsement, type EndorsementInput } from '../fetchers/endorsements.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook for creating an endorsement of another user's skill. The
 * mutation needs the endorsed user's handle/DID (not the endorser's)
 * so the endorsed profile + their endorsement count caches get
 * invalidated; pass `null` to skip endorsed-profile invalidation
 * (e.g., if you only know the skill URI).
 */
export function useCreateEndorsement(
  endorsedHandleOrDid: string | null,
  options?: Omit<UseMutationOptions<CreateResult, Error, EndorsementInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EndorsementInput) => createEndorsement(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success && endorsedHandleOrDid) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.profile.byHandle(endorsedHandleOrDid),
        });
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.endorsement.count(endorsedHandleOrDid),
        });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
