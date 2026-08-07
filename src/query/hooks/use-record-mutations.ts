'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type CreateResult, type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import { createRecord, deleteRecord, updateRecord } from '../fetchers/records.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

/** Variables for {@link useCreateRecord}. */
export interface CreateRecordVariables {
  collection: string;
  data: Record<string, unknown>;
}

/**
 * Generic record-create escape hatch for collections without a
 * dedicated section helper (certifications, projects, publications,
 * volunteering, honors, languages, courses). Prefer the typed helpers
 * when one exists for the section.
 */
export function useCreateRecord(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<CreateResult, Error, CreateRecordVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: ({ collection, data }: CreateRecordVariables) =>
      createRecord(config, collection, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** Variables for {@link useUpdateRecord}. */
export interface UpdateRecordVariables {
  collection: string;
  rkey: string;
  data: Record<string, unknown>;
}

/** Generic record-update escape hatch. See {@link useCreateRecord}. */
export function useUpdateRecord(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, UpdateRecordVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: ({ collection, rkey, data }: UpdateRecordVariables) =>
      updateRecord(config, collection, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** Variables for {@link useDeleteRecord}. */
export interface DeleteRecordVariables {
  collection: string;
  rkey: string;
}

/** Generic record-delete escape hatch. See {@link useCreateRecord}. */
export function useDeleteRecord(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, DeleteRecordVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: ({ collection, rkey }: DeleteRecordVariables) =>
      deleteRecord(config, collection, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
