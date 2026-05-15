'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  bulkHideStandardPublications,
  bulkUnhideStandardPublications,
  hideOrcidPublication,
  hideSifaPublication,
  hideStandardPublication,
  refreshOrcidPublications,
  unhideOrcidPublication,
  unhideSifaPublication,
  unhideStandardPublication,
  type RefreshOrcidPublicationsResult,
} from '../fetchers/publications.js';
import { sifaQueryKeys } from '../keys.js';

async function invalidateProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  ownerHandleOrDid: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: sifaQueryKeys.profile.byHandle(ownerHandleOrDid),
  });
}

function makeWriteHook<TVariable>(
  fetcher: (config: ReturnType<typeof useSifaConfig>, v: TVariable) => Promise<WriteResult>,
) {
  return function useHook(
    ownerHandleOrDid: string,
    options?: Omit<UseMutationOptions<WriteResult, Error, TVariable>, 'mutationFn'>,
  ) {
    const config = useSifaConfig();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (v: TVariable) => fetcher(config, v),
      onSuccess: async (result, variables, onMutateResult, context) => {
        if (result.success) {
          await invalidateProfile(queryClient, ownerHandleOrDid);
        }
        await options?.onSuccess?.(result, variables, onMutateResult, context);
      },
      ...options,
    });
  };
}

/** React hook for hiding an ORCID publication. Variable: the `putCode` number. */
export const useHideOrcidPublication = makeWriteHook<number>((config, putCode) =>
  hideOrcidPublication(config, putCode),
);

/** React hook for unhiding an ORCID publication. Variable: the `putCode` number. */
export const useUnhideOrcidPublication = makeWriteHook<number>((config, putCode) =>
  unhideOrcidPublication(config, putCode),
);

/** React hook for hiding a standard publication. Variable: the AT URI string. */
export const useHideStandardPublication = makeWriteHook<string>((config, uri) =>
  hideStandardPublication(config, uri),
);

/** React hook for unhiding a standard publication. Variable: the AT URI string. */
export const useUnhideStandardPublication = makeWriteHook<string>((config, uri) =>
  unhideStandardPublication(config, uri),
);

/** React hook for bulk-hiding standard publications. Variable: the URI list. */
export const useBulkHideStandardPublications = makeWriteHook<string[]>((config, uris) =>
  bulkHideStandardPublications(config, uris),
);

/** React hook for bulk-unhiding standard publications. Variable: the URI list. */
export const useBulkUnhideStandardPublications = makeWriteHook<string[]>((config, uris) =>
  bulkUnhideStandardPublications(config, uris),
);

/** React hook for hiding a Sifa-authored publication. Variable: the `rkey` string. */
export const useHideSifaPublication = makeWriteHook<string>((config, rkey) =>
  hideSifaPublication(config, rkey),
);

/** React hook for unhiding a Sifa-authored publication. Variable: the `rkey` string. */
export const useUnhideSifaPublication = makeWriteHook<string>((config, rkey) =>
  unhideSifaPublication(config, rkey),
);

/** React hook for re-pulling ORCID publications. */
export function useRefreshOrcidPublications(
  ownerHandleOrDid: string,
  options?: Omit<UseMutationOptions<RefreshOrcidPublicationsResult, Error, void>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshOrcidPublications(config),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await invalidateProfile(queryClient, ownerHandleOrDid);
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
    ...options,
  });
}
