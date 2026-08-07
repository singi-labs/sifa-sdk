'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import { revealMarqueDomain, unrevealMarqueDomain } from '../fetchers/marque-domains.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

/** React hook for revealing (making public) a Marque domain. Variable: the domain string. */
export function useRevealMarqueDomain(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (domain: string) => revealMarqueDomain(config, domain),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for hiding a previously-revealed Marque domain again. */
export function useUnrevealMarqueDomain(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (domain: string) => unrevealMarqueDomain(config, domain),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
