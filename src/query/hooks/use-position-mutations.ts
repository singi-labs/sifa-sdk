'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  deletePosition,
  linkSkillToPosition,
  setPositionPrimary,
  unlinkSkillFromPosition,
  unsetPositionPrimary,
  updatePosition,
} from '../fetchers/positions.js';
import { sifaQueryKeys } from '../keys.js';
import type { ProfilePosition, SkillRef } from '../../types/index.js';

async function invalidatePositionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.position.byOwner(ownerHandleOrDid),
  });
}

/** Variables for {@link useUpdatePosition}. */
export interface UpdatePositionVariables {
  rkey: string;
  data: Record<string, unknown>;
}

/** React hook for updating a position record. */
export function useUpdatePosition(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, UpdatePositionVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rkey, data }: UpdatePositionVariables) => updatePosition(config, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for deleting a position record. Variable: the `rkey` string. */
export function useDeletePosition(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => deletePosition(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for marking a position as primary. Variable: the `rkey` string. */
export function useSetPositionPrimary(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => setPositionPrimary(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for clearing the primary flag on a position. */
export function useUnsetPositionPrimary(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => unsetPositionPrimary(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useLinkSkillToPosition} / {@link useUnlinkSkillFromPosition}. */
export interface PositionSkillLinkVariables {
  position: ProfilePosition;
  skillRef: SkillRef;
}

/** React hook for linking a skill to a position. Idempotent. */
export function useLinkSkillToPosition(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, PositionSkillLinkVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ position, skillRef }: PositionSkillLinkVariables) =>
      linkSkillToPosition(config, position, skillRef),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for unlinking a skill from a position. */
export function useUnlinkSkillFromPosition(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, PositionSkillLinkVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ position, skillRef }: PositionSkillLinkVariables) =>
      unlinkSkillFromPosition(config, position, skillRef),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidatePositionCaches(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
