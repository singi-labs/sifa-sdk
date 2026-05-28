'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  bulkHideProfileItems,
  bulkUnhideProfileItems,
  hideProfileItem,
  unhideProfileItem,
  type BulkHideProfileItemInput,
  type HideProfileItemInput,
} from '../fetchers/profile-items-hide.js';
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

/**
 * Hide one profile item across any supported section. The underlying
 * record stays on the user's PDS; only its display on sifa.id is
 * suppressed.
 */
export const useHideProfileItem = makeWriteHook<HideProfileItemInput>((config, input) =>
  hideProfileItem(config, input),
);

/** Restore a previously-hidden profile item. */
export const useUnhideProfileItem = makeWriteHook<HideProfileItemInput>((config, input) =>
  unhideProfileItem(config, input),
);

/** Bulk-hide profile items sharing the same `itemType` + `source`. */
export const useBulkHideProfileItems = makeWriteHook<BulkHideProfileItemInput>((config, input) =>
  bulkHideProfileItems(config, input),
);

/** Bulk-unhide profile items sharing the same `itemType` + `source`. */
export const useBulkUnhideProfileItems = makeWriteHook<BulkHideProfileItemInput>((config, input) =>
  bulkUnhideProfileItems(config, input),
);
