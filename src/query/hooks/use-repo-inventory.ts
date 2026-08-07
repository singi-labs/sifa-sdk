'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { RepoDeleteResult, RepoInventory } from '../../repo/types.js';
import { useSifaConfig } from '../config.js';
import {
  deleteRepoRecords,
  fetchRepoInventory,
  type RepoDeleteInput,
} from '../fetchers/repo-inventory.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Read the id.sifa.* records in the authenticated user's repo.
 *
 * Not cached client-side: this is a page about what exists right now, and a
 * user who deletes a record, navigates away and comes back must not be shown
 * it again from cache. The server caches the PDS read briefly, which is where
 * that cost belongs.
 */
export function useRepoInventory(
  options?: Omit<
    UseQueryOptions<
      RepoInventory,
      Error,
      RepoInventory,
      ReturnType<typeof sifaQueryKeys.repoInventory.list>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.repoInventory.list(),
    queryFn: () => fetchRepoInventory(config),
    staleTime: 0,
    gcTime: 0,
    ...options,
  });
}

/**
 * Delete records from the authenticated user's repo.
 *
 * Invalidates the whole Sifa key subtree, not just the inventory: the records
 * being removed are the ones the profile is built from, so anything showing
 * profile content is stale the moment this succeeds.
 */
export function useDeleteRepoRecords(
  options?: Omit<
    UseMutationOptions<
      RepoDeleteResult & { success: boolean; error?: string },
      Error,
      RepoDeleteInput
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (input: RepoDeleteInput) => deleteRepoRecords(config, input),
    onSuccess: async (result, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.all() });
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
