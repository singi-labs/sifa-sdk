'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createReaction,
  deleteReaction,
  type ReactionError,
  type ReactionResult,
} from '../fetchers/reactions.js';
import { sifaQueryKeys } from '../keys.js';

/** Variables for {@link useCreateReaction}. */
export interface CreateReactionVariables {
  targetUri: string;
  appId: string;
  targetCid?: string;
}

type CreateReactionMutationResult =
  { ok: true; data: ReactionResult } | { ok: false; error: ReactionError };

/**
 * React hook for creating a reaction. Returns the discriminated-union
 * result so the caller can detect `scope_insufficient` and trigger an
 * OAuth scope-upgrade flow.
 *
 * Invalidates the entire `sifaQueryKeys.reactions.all()` subtree on
 * success (any cached `useReactionStatus` view that includes the new
 * URI needs a refresh).
 */
export function useCreateReaction(
  options?: Omit<
    UseMutationOptions<CreateReactionMutationResult, Error, CreateReactionVariables>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUri, appId, targetCid }: CreateReactionVariables) =>
      createReaction(config, targetUri, appId, targetCid),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.ok) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.reactions.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useDeleteReaction}. */
export interface DeleteReactionVariables {
  targetUri: string;
  appId: string;
}

/** React hook for deleting a reaction. */
export function useDeleteReaction(
  options?: Omit<UseMutationOptions<WriteResult, Error, DeleteReactionVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUri, appId }: DeleteReactionVariables) =>
      deleteReaction(config, targetUri, appId),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.reactions.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
