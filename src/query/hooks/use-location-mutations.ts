'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type CreateResult, type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createProfileLocation,
  deleteProfileLocation,
  updateProfileLocation,
  type ProfileLocationInput,
} from '../fetchers/profile-locations.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

/** React hook for creating a profile location record. */
export function useCreateProfileLocation(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<CreateResult, Error, ProfileLocationInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: ProfileLocationInput) => createProfileLocation(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** Variables for {@link useUpdateProfileLocation}. */
export interface UpdateProfileLocationVariables {
  rkey: string;
  data: ProfileLocationInput;
}

/** React hook for updating a profile location record. */
export function useUpdateProfileLocation(
  ownerHandleOrDid: string,
  options?: Omit<
    UseMutationOptions<WriteResult, Error, UpdateProfileLocationVariables>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: ({ rkey, data }: UpdateProfileLocationVariables) =>
      updateProfileLocation(config, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for deleting a profile location record. Variable: the `rkey` string. */
export function useDeleteProfileLocation(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (rkey: string) => deleteProfileLocation(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
