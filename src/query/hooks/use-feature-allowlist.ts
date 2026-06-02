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
  addFeatureAllowlist,
  listFeatureAllowlist,
  removeFeatureAllowlist,
  type FeatureAllowlistResponse,
} from '../fetchers/admin-feature-allowlists.js';
import type { FeatureAllowlistEntry, FeatureFlag } from '../../schemas/follow-profile.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Read hook for the admin allowlist of a given feature flag. Admin-gated on
 * the server; non-admins get an empty list (the fetcher swallows 403).
 */
export function useFeatureAllowlist(
  flag: FeatureFlag,
  options?: Omit<
    UseQueryOptions<
      FeatureAllowlistResponse,
      Error,
      FeatureAllowlistResponse,
      ReturnType<typeof sifaQueryKeys.admin.featureAllowlist>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.admin.featureAllowlist(flag),
    queryFn: () => listFeatureAllowlist(config, flag),
    ...options,
  });
}

/** Snapshot of the previous cache entry; returned from `onMutate` for rollback. */
interface AllowlistMutationContext {
  previous: FeatureAllowlistResponse | undefined;
}

/** Variables for {@link useAddFeatureAllowlist}. */
export interface AddFeatureAllowlistVariables {
  did: string;
  note?: string;
}

/**
 * Mutation hook to add (or upsert) a DID on the given flag's allowlist.
 * Optimistically prepends a synthesized entry to the cache so admin UIs feel
 * instant; rolls back if the server reports failure.
 */
export function useAddFeatureAllowlist(
  flag: FeatureFlag,
  options?: Omit<
    UseMutationOptions<WriteResult, Error, AddFeatureAllowlistVariables, AllowlistMutationContext>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  const key = sifaQueryKeys.admin.featureAllowlist(flag);

  return useMutation<WriteResult, Error, AddFeatureAllowlistVariables, AllowlistMutationContext>({
    mutationFn: ({ did, note }) => addFeatureAllowlist(config, flag, did, { note }),
    onMutate: async ({ did, note }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeatureAllowlistResponse>(key);
      const optimisticEntry: FeatureAllowlistEntry = {
        did,
        addedAt: new Date().toISOString(),
        note: note ?? null,
      };
      const next: FeatureAllowlistResponse = previous
        ? { items: [optimisticEntry, ...previous.items.filter((e) => e.did !== did)] }
        : { items: [optimisticEntry] };
      queryClient.setQueryData<FeatureAllowlistResponse>(key, next);
      return { previous };
    },
    onSuccess: async (result, variables, onMutateResult, context) => {
      // The fetcher's never-throws contract (see {@link apiWrite}) means a
      // server-side failure surfaces here as `result.success === false`, not
      // as an `onError`. Roll back the optimistic insert in that case.
      if (!result.success && onMutateResult?.previous) {
        queryClient.setQueryData(key, onMutateResult.previous);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      if (onMutateResult?.previous) {
        queryClient.setQueryData(key, onMutateResult.previous);
      }
      await options?.onError?.(error, variables, onMutateResult, context);
    },
    onSettled: async (result, error, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: key });
      await options?.onSettled?.(result, error, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useRemoveFeatureAllowlist}. */
export interface RemoveFeatureAllowlistVariables {
  did: string;
}

/**
 * Mutation hook to remove a DID from the given flag's allowlist.
 * Optimistically removes the row from the cache; rolls back if the server
 * reports failure.
 */
export function useRemoveFeatureAllowlist(
  flag: FeatureFlag,
  options?: Omit<
    UseMutationOptions<
      WriteResult,
      Error,
      RemoveFeatureAllowlistVariables,
      AllowlistMutationContext
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  const key = sifaQueryKeys.admin.featureAllowlist(flag);

  return useMutation<WriteResult, Error, RemoveFeatureAllowlistVariables, AllowlistMutationContext>(
    {
      mutationFn: ({ did }) => removeFeatureAllowlist(config, flag, did),
      onMutate: async ({ did }) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData<FeatureAllowlistResponse>(key);
        if (previous) {
          queryClient.setQueryData<FeatureAllowlistResponse>(key, {
            items: previous.items.filter((e) => e.did !== did),
          });
        }
        return { previous };
      },
      onSuccess: async (result, variables, onMutateResult, context) => {
        if (!result.success && onMutateResult?.previous) {
          queryClient.setQueryData(key, onMutateResult.previous);
        }
        await options?.onSuccess?.(result, variables, onMutateResult, context);
      },
      onError: async (error, variables, onMutateResult, context) => {
        if (onMutateResult?.previous) {
          queryClient.setQueryData(key, onMutateResult.previous);
        }
        await options?.onError?.(error, variables, onMutateResult, context);
      },
      onSettled: async (result, error, variables, onMutateResult, context) => {
        await queryClient.invalidateQueries({ queryKey: key });
        await options?.onSettled?.(result, error, variables, onMutateResult, context);
      },
      ...options,
    },
  );
}
