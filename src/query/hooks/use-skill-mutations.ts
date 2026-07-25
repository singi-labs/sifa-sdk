'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type CreateResult, type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createSkill,
  deleteSkill,
  updateSkill,
  updateSkillSubCategories,
  type SubCategoryBulkResult,
} from '../fetchers/skills.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

/** React hook for creating a skill record. */
export function useCreateSkill(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<CreateResult, Error, Record<string, unknown>>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createSkill(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useUpdateSkill}. */
export interface UpdateSkillVariables {
  rkey: string;
  data: Record<string, unknown>;
}

/** React hook for updating a skill record. */
export function useUpdateSkill(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, UpdateSkillVariables>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rkey, data }: UpdateSkillVariables) => updateSkill(config, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useUpdateSkillSubCategories}. */
export interface UpdateSkillSubCategoriesVariables {
  rkeys: string[];
  subCategory: string;
}

/**
 * React hook for setting (or clearing) the sub-category on many skills in a
 * single request. An empty `subCategory` clears the field.
 */
export function useUpdateSkillSubCategories(
  ownerHandleOrDid: string,
  options?: Omit<
    UseMutationOptions<
      WriteResult & SubCategoryBulkResult,
      Error,
      UpdateSkillSubCategoriesVariables
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rkeys, subCategory }: UpdateSkillSubCategoriesVariables) =>
      updateSkillSubCategories(config, rkeys, subCategory),
    // `...options` comes first so a caller-supplied onSuccess cannot replace the
    // wrapper below and silently skip profile invalidation; the wrapper calls it
    // instead. The older skill hooks in this file spread options last and still
    // carry that bug.
    ...options,
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** React hook for deleting a skill record. Variable: the `rkey` string. */
export function useDeleteSkill(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => deleteSkill(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
