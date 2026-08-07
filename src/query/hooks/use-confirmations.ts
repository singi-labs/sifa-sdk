'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { type CreateResult, type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createConfirmation,
  dismissConfirmation,
  fetchGivenConfirmations,
  fetchPendingConfirmations,
  revokeConfirmation,
  type ConfirmationInput,
  type ConfirmationSubjectInput,
  type GivenConfirmation,
  type PendingConfirmationsPage,
} from '../fetchers/confirmations.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Claims naming the signed-in user that await their decision. Returns an empty
 * page when signed out or on error, so callers can render "nothing pending"
 * without special-casing either.
 */
export function usePendingConfirmations(
  options?: Omit<
    UseQueryOptions<
      PendingConfirmationsPage,
      Error,
      PendingConfirmationsPage,
      ReturnType<typeof sifaQueryKeys.confirmation.pending>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.confirmation.pending(),
    queryFn: () => fetchPendingConfirmations(config),
    ...options,
  });
}

/**
 * Confirmations the signed-in user has already given, with whether each has
 * drifted since. Returns an empty list when signed out or on error.
 */
export function useGivenConfirmations(
  options?: Omit<
    UseQueryOptions<
      { confirmations: GivenConfirmation[] },
      Error,
      { confirmations: GivenConfirmation[] },
      ReturnType<typeof sifaQueryKeys.confirmation.given>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.confirmation.given(),
    queryFn: () => fetchGivenConfirmations(config),
    ...options,
  });
}

/**
 * Affirm a claim naming you. On success it leaves the inbox and starts
 * rendering with your name and avatar on the claimer's profile, so both the
 * inbox and the claimer's profile cache are invalidated.
 *
 * `claimerHandleOrDid` is whose profile the claim displays on; pass `null` to
 * skip profile invalidation. Note this is the claimer, not the confirming
 * user: confirming changes what renders on *their* profile, not yours.
 */
export function useCreateConfirmation(
  claimerHandleOrDid: string | null,
  options?: Omit<UseMutationOptions<CreateResult, Error, ConfirmationInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: ConfirmationInput) => createConfirmation(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.confirmation.pending(),
        });
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.confirmation.given(),
        });
        if (claimerHandleOrDid) {
          await queryClient.invalidateQueries({
            queryKey: sifaQueryKeys.profile.byHandle(claimerHandleOrDid),
          });
        }
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/**
 * Dismiss a claim naming you. Only the inbox is invalidated -- a dismissal
 * changes nothing that displays anywhere, so no profile cache is affected.
 */
export function useDismissConfirmation(
  options?: Omit<UseMutationOptions<WriteResult, Error, ConfirmationSubjectInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: ConfirmationSubjectInput) => dismissConfirmation(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.confirmation.pending(),
        });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/**
 * Withdraw a confirmation you previously gave. Unlike a dismissal this does
 * change what displays, so the claimer's profile cache is invalidated too.
 */
export function useRevokeConfirmation(
  claimerHandleOrDid: string | null,
  options?: Omit<UseMutationOptions<WriteResult, Error, ConfirmationSubjectInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: ConfirmationSubjectInput) => revokeConfirmation(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.confirmation.pending(),
        });
        if (claimerHandleOrDid) {
          await queryClient.invalidateQueries({
            queryKey: sifaQueryKeys.profile.byHandle(claimerHandleOrDid),
          });
        }
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
