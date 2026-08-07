'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { createPosition, type CreateResult } from '../fetchers/positions.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook for creating a new position record. On success, invalidates
 * the owner's profile cache so the new position is reflected on the next
 * read.
 *
 * The owner DID is required so the mutation can target the correct
 * profile cache entry for invalidation.
 */
export function useCreatePosition(
  ownerDid: string,
  options?: Omit<UseMutationOptions<CreateResult, Error, Record<string, unknown>>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();

  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: Record<string, unknown>) => createPosition(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.byHandle(ownerDid) });
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.position.byOwner(ownerDid) });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
