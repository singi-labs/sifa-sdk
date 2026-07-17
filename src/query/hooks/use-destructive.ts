'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  deleteAccount,
  resetProfile,
  type DeleteAccountResult,
  type ResetProfileResult,
} from '../fetchers/destructive.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook for resetting the authenticated user's Sifa profile.
 * Variable: `deletePdsData` boolean.
 *
 * Invalidates the entire `sifaQueryKeys.all()` subtree on success
 * (everything Sifa-related needs a refresh after a reset).
 */
export function useResetProfile(
  options?: Omit<UseMutationOptions<ResetProfileResult, Error, boolean>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deletePdsData: boolean) => resetProfile(config, deletePdsData),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/**
 * React hook for deleting the authenticated user's account. Variable:
 * `deletePdsData` boolean. Returns the deleted handle on success.
 *
 * On success, clears the entire query cache (the user is logged out
 * and nothing they previously cached should be retained).
 */
export function useDeleteAccount(
  options?: Omit<UseMutationOptions<DeleteAccountResult, Error, boolean>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deletePdsData: boolean) => deleteAccount(config, deletePdsData),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        queryClient.clear();
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
