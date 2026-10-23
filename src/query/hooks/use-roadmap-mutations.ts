'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  castRoadmapItemVote,
  retractRoadmapItemVote,
  type CastRoadmapVoteResult,
  type RoadmapItemRef,
} from '../fetchers/roadmap.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateRoadmap(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.roadmap.all() });
}

/**
 * React hook for voting on a roadmap board item. Variable: the item's
 * `{ did, rkey }`. Returns the discriminated-union result so callers can
 * detect `scope_insufficient` and trigger an OAuth scope-upgrade flow.
 *
 * Board data from `fetchRoadmap` is usually server-rendered, so the
 * invalidation here does not refresh it: keep optimistic local state or call
 * `router.refresh()`. Voting twice is safe; the API answers 200.
 */
export function useCastRoadmapItemVote(
  options?: Omit<UseMutationOptions<CastRoadmapVoteResult, Error, RoadmapItemRef>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (item: RoadmapItemRef) => castRoadmapItemVote(config, item),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.ok) {
        await invalidateRoadmap(queryClient);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for retracting a vote on a roadmap board item. */
export function useRetractRoadmapItemVote(
  options?: Omit<UseMutationOptions<WriteResult, Error, RoadmapItemRef>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (item: RoadmapItemRef) => retractRoadmapItemVote(config, item),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateRoadmap(queryClient);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
