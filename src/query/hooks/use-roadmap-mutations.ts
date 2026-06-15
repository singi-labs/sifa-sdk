'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  castRoadmapVote,
  retractRoadmapVote,
  type CastRoadmapVoteResult,
} from '../fetchers/roadmap.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateRoadmap(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.roadmap.all() });
}

/**
 * React hook for casting a roadmap vote. Variable: the item key.
 *
 * Returns the discriminated-union result so callers can detect
 * `scope_insufficient` and trigger an OAuth scope-upgrade flow
 * (see {@link castRoadmapVote}).
 */
export function useCastRoadmapVote(
  options?: Omit<UseMutationOptions<CastRoadmapVoteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => castRoadmapVote(config, key),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.ok) {
        await invalidateRoadmap(queryClient);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for retracting a previously-cast roadmap vote. */
export function useRetractRoadmapVote(
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => retractRoadmapVote(config, key),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateRoadmap(queryClient);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
