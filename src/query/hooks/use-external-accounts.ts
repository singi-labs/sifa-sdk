'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { ExternalAccount } from '../../types/index.js';
import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createExternalAccount,
  deleteExternalAccount,
  fetchExternalAccounts,
  setExternalAccountPrimary,
  unsetExternalAccountPrimary,
  updateExternalAccount,
  verifyExternalAccount,
  type CreateExternalAccountResult,
  type ExternalAccountInput,
  type VerifyExternalAccountResult,
} from '../fetchers/external-accounts.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfileAndExternalAccounts(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.externalAccounts(ownerHandleOrDid),
  });
}

/** React hook for reading the external-accounts list. Returns `[]` data on error. */
export function useExternalAccounts(
  handleOrDid: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      ExternalAccount[],
      Error,
      ExternalAccount[],
      ReturnType<typeof sifaQueryKeys.profile.externalAccounts>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.externalAccounts(handleOrDid ?? ''),
    queryFn: () => fetchExternalAccounts(config, handleOrDid ?? ''),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}

/** React hook for creating an external account. */
export function useCreateExternalAccount(
  ownerHandleOrDid: string,
  options?: Omit<
    UseMutationOptions<CreateExternalAccountResult, Error, ExternalAccountInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExternalAccountInput) => createExternalAccount(config, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** Variables for {@link useUpdateExternalAccount}. */
export interface UpdateExternalAccountVariables {
  rkey: string;
  data: ExternalAccountInput;
}

/** React hook for updating an external account. */
export function useUpdateExternalAccount(
  ownerHandleOrDid: string,
  options?: Omit<
    UseMutationOptions<WriteResult, Error, UpdateExternalAccountVariables>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rkey, data }: UpdateExternalAccountVariables) =>
      updateExternalAccount(config, rkey, data),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for deleting an external account. Variable: the `rkey` string. */
export function useDeleteExternalAccount(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => deleteExternalAccount(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for marking an external account primary. */
export function useSetExternalAccountPrimary(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => setExternalAccountPrimary(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for clearing the primary flag on an external account. */
export function useUnsetExternalAccountPrimary(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => unsetExternalAccountPrimary(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}

/** React hook for running server-side verification of an external account. */
export function useVerifyExternalAccount(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<VerifyExternalAccountResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rkey: string) => verifyExternalAccount(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfileAndExternalAccounts(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
