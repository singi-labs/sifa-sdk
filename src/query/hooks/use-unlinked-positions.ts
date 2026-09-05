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
  dismissUnlinkedPosition,
  fetchUnlinkedPositions,
  type DismissUnlinkedPositionInput,
  type UnlinkedPositionsResult,
} from '../fetchers/unlinked-positions.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Positions on the signed-in user's profile whose company is not yet linked to a
 * canonical entity, for the unified Inbox. Returns an empty list when signed out
 * or on error.
 */
export function useUnlinkedPositions(
  options?: Omit<
    UseQueryOptions<
      UnlinkedPositionsResult,
      Error,
      UnlinkedPositionsResult,
      ReturnType<typeof sifaQueryKeys.position.unlinked>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.position.unlinked(),
    queryFn: () => fetchUnlinkedPositions(config),
    ...options,
  });
}

/**
 * Dismiss the unlinked-company task for one position. On success the position
 * leaves the Inbox and the bell count, so both the unlinked-positions list and
 * the inbox counts are invalidated.
 */
export function useDismissUnlinkedPosition(
  options?: Omit<
    UseMutationOptions<WriteResult, Error, DismissUnlinkedPositionInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: DismissUnlinkedPositionInput) => dismissUnlinkedPosition(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.position.unlinked() });
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.inbox.counts() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
