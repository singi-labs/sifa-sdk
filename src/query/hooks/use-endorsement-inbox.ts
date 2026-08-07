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
import { confirmEndorsement, type ConfirmEndorsementInput } from '../fetchers/endorsements.js';
import {
  dismissEndorsement,
  fetchPendingEndorsements,
  type DismissEndorsementInput,
  type PendingEndorsementsPage,
} from '../fetchers/endorsement-inbox.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Endorsements awaiting the signed-in user's decision. Returns an empty page
 * when signed out or on error, so callers can render "nothing pending" without
 * special-casing either.
 */
export function usePendingEndorsements(
  options?: Omit<
    UseQueryOptions<
      PendingEndorsementsPage,
      Error,
      PendingEndorsementsPage,
      ReturnType<typeof sifaQueryKeys.endorsement.pending>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.endorsement.pending(),
    queryFn: () => fetchPendingEndorsements(config),
    ...options,
  });
}

/**
 * Confirm a received endorsement. On success the endorsement leaves the inbox
 * and starts displaying, so both the inbox and the subject's own profile and
 * count caches are invalidated.
 *
 * `subjectHandleOrDid` is the confirming user (the endorsement's subject);
 * pass `null` to skip profile invalidation.
 */
export function useConfirmEndorsement(
  subjectHandleOrDid: string | null,
  options?: Omit<UseMutationOptions<CreateResult, Error, ConfirmEndorsementInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: ConfirmEndorsementInput) => confirmEndorsement(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.endorsement.pending(),
        });
        if (subjectHandleOrDid) {
          await queryClient.invalidateQueries({
            queryKey: sifaQueryKeys.profile.byHandle(subjectHandleOrDid),
          });
          await queryClient.invalidateQueries({
            queryKey: sifaQueryKeys.endorsement.count(subjectHandleOrDid),
          });
        }
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/**
 * Dismiss a received endorsement. Only the inbox is invalidated -- a dismissal
 * changes nothing that displays anywhere, so no profile cache is affected.
 */
export function useDismissEndorsement(
  options?: Omit<UseMutationOptions<WriteResult, Error, DismissEndorsementInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied handler would otherwise replace the
    // one below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: DismissEndorsementInput) => dismissEndorsement(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.endorsement.pending(),
        });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
