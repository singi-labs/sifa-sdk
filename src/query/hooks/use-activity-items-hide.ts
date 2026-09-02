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
  fetchHiddenActivityItems,
  hideActivityItem,
  unhideActivityItem,
  type HiddenActivityItem,
  type HideActivityItemInput,
  type UnhideActivityItemInput,
} from '../fetchers/activity-items-hide.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Everything the authenticated user has hidden from their activity, for the
 * unhide list in settings.
 */
export function useHiddenActivityItems(
  options?: Omit<
    UseQueryOptions<
      HiddenActivityItem[],
      Error,
      HiddenActivityItem[],
      ReturnType<typeof sifaQueryKeys.activity.hiddenItems>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.hiddenItems(),
    queryFn: () => fetchHiddenActivityItems(config),
    ...options,
  });
}

function makeHideHook<TVariable>(
  fetcher: (config: ReturnType<typeof useSifaConfig>, v: TVariable) => Promise<WriteResult>,
) {
  return function useHook(
    options?: Omit<UseMutationOptions<WriteResult, Error, TVariable>, 'mutationFn'>,
  ) {
    const config = useSifaConfig();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (v: TVariable) => fetcher(config, v),
      onSuccess: async (result, variables, onMutateResult, context) => {
        if (result.success) {
          // Every activity surface changes at once: the feed, the teaser on the
          // profile, the heatmap, and the hidden list itself.
          await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.activity.all() });
        }
        await options?.onSuccess?.(result, variables, onMutateResult, context);
      },
      ...options,
    });
  };
}

/**
 * Hide one activity item from the caller's own profile. The record stays on
 * their PDS; only its appearance on sifa.id is suppressed.
 */
export const useHideActivityItem = makeHideHook<HideActivityItemInput>((config, input) =>
  hideActivityItem(config, input),
);

/** Restore a previously-hidden activity item. */
export const useUnhideActivityItem = makeHideHook<UnhideActivityItemInput>((config, input) =>
  unhideActivityItem(config, input),
);
