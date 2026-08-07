'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  createInvestment,
  updateInvestment,
  deleteInvestment,
  type CreateResult,
  type WriteResult,
} from '../fetchers/investments.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hooks for investment records. Each invalidates the owner's profile cache on
 * success so the section reflects the write on the next read.
 *
 * The owner DID is required so the mutation can target the correct cache entry.
 */
export function useCreateInvestment(
  ownerDid: string,
  options?: Omit<UseMutationOptions<CreateResult, Error, Record<string, unknown>>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createInvestment(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.byHandle(ownerDid) });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useUpdateInvestment(
  ownerDid: string,
  options?: Omit<
    UseMutationOptions<WriteResult, Error, { rkey: string; data: Record<string, unknown> }>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rkey, data }: { rkey: string; data: Record<string, unknown> }) =>
      updateInvestment(config, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.byHandle(ownerDid) });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

export function useDeleteInvestment(
  ownerDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rkey: string) => deleteInvestment(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.byHandle(ownerDid) });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
