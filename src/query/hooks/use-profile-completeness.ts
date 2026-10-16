'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { type WriteResult } from '../client.js';

import { useSifaConfig } from '../config.js';
import {
  clearCompletenessDismissals,
  dismissCompletenessSignal,
  fetchProfileCompleteness,
  type DismissCompletenessSignalInput,
  type ProfileCompleteness,
} from '../fetchers/profile-completeness.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Completeness of the signed-in user's own profile (which tracked signals are
 * missing), for the unified Inbox checklist. Returns a complete result when
 * signed out or on error.
 */
export function useProfileCompleteness(
  options?: Omit<
    UseQueryOptions<
      ProfileCompleteness,
      Error,
      ProfileCompleteness,
      ReturnType<typeof sifaQueryKeys.profile.completeness>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.completeness(),
    queryFn: () => fetchProfileCompleteness(config),
    ...options,
  });
}

/**
 * Hide one "complete your profile" item. On success the item leaves the
 * checklist and the bell count, so completeness and inbox counts are
 * invalidated.
 */
export function useDismissCompletenessSignal(
  options?: Omit<
    UseMutationOptions<WriteResult, Error, DismissCompletenessSignalInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: DismissCompletenessSignalInput) => dismissCompletenessSignal(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.completeness() });
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.inbox.counts() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/**
 * Show every hidden "complete your profile" item again. Invalidates the same
 * queries as {@link useDismissCompletenessSignal}.
 */
export function useClearCompletenessDismissals(
  options?: Omit<UseMutationOptions<WriteResult, Error, void>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first, as above.
    ...options,
    mutationFn: () => clearCompletenessDismissals(config),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profile.completeness() });
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.inbox.counts() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
