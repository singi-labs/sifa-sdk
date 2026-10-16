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
  addProfileEmail,
  fetchProfileEmails,
  removeProfileEmail,
  resendProfileEmailVerification,
  type ProfileEmail,
  type ProfileEmails,
  type ProfileEmailSendStatus,
} from '../fetchers/profile-emails.js';
import { sifaQueryKeys } from '../keys.js';

/** The signed-in account's email addresses. */
export function useProfileEmails(
  options?: Omit<
    UseQueryOptions<
      ProfileEmails,
      Error,
      ProfileEmails,
      ReturnType<typeof sifaQueryKeys.profileEmails.list>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profileEmails.list(),
    queryFn: () => fetchProfileEmails(config),
    ...options,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: sifaQueryKeys.profileEmails.all() });
}

export function useAddProfileEmail(
  options?: Omit<
    UseMutationOptions<
      WriteResult<ProfileEmail & { sendStatus: ProfileEmailSendStatus }>,
      Error,
      string
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidate();
  return useMutation({
    // Spread first so a consumer handler cannot drop the invalidation.
    ...options,
    mutationFn: (email: string) => addProfileEmail(config, email),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

export function useResendProfileEmailVerification(
  options?: Omit<
    UseMutationOptions<WriteResult<{ sendStatus: ProfileEmailSendStatus }>, Error, number>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidate();
  return useMutation({
    ...options,
    mutationFn: (id: number) => resendProfileEmailVerification(config, id),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

export function useRemoveProfileEmail(
  options?: Omit<UseMutationOptions<WriteResult, Error, number>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidate();
  return useMutation({
    ...options,
    mutationFn: (id: number) => removeProfileEmail(config, id),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
