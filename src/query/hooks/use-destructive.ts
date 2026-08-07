'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  deleteAccount,
  fetchWipePreview,
  resetProfile,
  type DeleteAccountResult,
  type ResetProfileResult,
  type WipePreview,
} from '../fetchers/destructive.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Read which id.sifa.* collections the current grant cannot delete, so a
 * delete-account UI can ask for the missing scope BEFORE the destructive step.
 *
 * Not cached: the whole point is to reflect the grant as it stands right now,
 * and the grant changes underneath this hook when the user returns from the
 * consent screen. A stale "no gaps" here is the failure this exists to prevent.
 */
export function useWipePreview(
  options?: Omit<
    UseQueryOptions<
      WipePreview,
      Error,
      WipePreview,
      ReturnType<typeof sifaQueryKeys.destructive.wipePreview>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.destructive.wipePreview(),
    queryFn: () => fetchWipePreview(config),
    staleTime: 0,
    gcTime: 0,
    ...options,
  });
}

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
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (deletePdsData: boolean) => resetProfile(config, deletePdsData),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
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
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (deletePdsData: boolean) => deleteAccount(config, deletePdsData),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        queryClient.clear();
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
