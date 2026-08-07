'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { type WriteResult } from '../client.js';
import {
  deleteAvatarOverride,
  refreshPds,
  updateProfileOverride,
  updateProfileSelf,
  uploadAvatar,
  type RefreshPdsResult,
  type UpdateProfileOverrideInput,
  type UpdateProfileSelfInput,
  type UploadAvatarResult,
} from '../fetchers/profile-mutations.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Invalidate the owner's profile cache after a profile-edit mutation
 * succeeds. Shared helper for the hooks in this file -- the owner DID
 * (or handle) is required so the mutation can target the correct cache
 * entry.
 */
async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

/**
 * React hook for updating the authenticated user's profile self record.
 * On success, invalidates the owner's profile cache.
 *
 * The owner identifier (handle or DID) is required so the mutation can
 * target the right profile cache entry for invalidation.
 */
export function useUpdateProfileSelf(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, UpdateProfileSelfInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: UpdateProfileSelfInput) => updateProfileSelf(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for updating the authenticated user's profile override fields. */
export function useUpdateProfileOverride(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, UpdateProfileOverrideInput>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (data: UpdateProfileOverrideInput) => updateProfileOverride(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for re-pulling the authenticated user's PDS-side profile. */
export function useRefreshPds(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<RefreshPdsResult, Error, void>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: () => refreshPds(config),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/**
 * React hook for uploading a new avatar. Pass a `File` (browser) or
 * `Blob` (Expo) as the mutation variable.
 */
export function useUploadAvatar(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<UploadAvatarResult, Error, Blob>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: (file: Blob) => uploadAvatar(config, file),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for deleting the avatar override (revert to PDS avatar). */
export function useDeleteAvatarOverride(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, void>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    // Spread first: a consumer-supplied onSuccess would otherwise replace the
    // handler below and silently drop cache invalidation (#453).
    ...options,
    mutationFn: () => deleteAvatarOverride(config),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
