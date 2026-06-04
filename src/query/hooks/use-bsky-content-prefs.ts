'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchBskyContentLabelPrefs,
  updateBskyContentLabelPrefs,
  type BskyContentLabelPrefs,
  type UpdateBskyContentLabelPrefsBody,
} from '../fetchers/bsky-preferences.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Read the viewer's Bluesky adult content-label preferences. The fetcher
 * returns `null` when the OAuth grant doesn't include the read scope
 * (sifa-api responds 403 with `needsScope: 'bsky-preferences'`); call
 * sites should treat `null` as "needs scope upgrade" and route through
 * the granular re-auth flow before retrying.
 *
 * Pass `enabled: false` for anonymous viewers — TanStack will skip the
 * fetch entirely and the gate will fall through to its default-hide path.
 */
export function useBskyContentLabelPrefs(
  options?: Omit<
    UseQueryOptions<
      BskyContentLabelPrefs | null,
      Error,
      BskyContentLabelPrefs | null,
      ReturnType<typeof sifaQueryKeys.bskyPreferences.contentLabels>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.bskyPreferences.contentLabels(),
    queryFn: () => fetchBskyContentLabelPrefs(config),
    // Prefs change rarely; long stale time keeps the gate snappy on
    // navigation. Invalidation after a write is explicit.
    staleTime: 5 * 60_000,
    ...options,
  });
}

/**
 * Mutation that updates one or more adult-content prefs on the viewer's
 * PDS via sifa-api, then writes the merged result back into the prefs
 * cache so the next render reflects the change without a refetch.
 */
export function useUpdateBskyContentLabelPrefs() {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBskyContentLabelPrefsBody) =>
      updateBskyContentLabelPrefs(config, body),
    onSuccess: (result) => {
      if (result.success && result.contentLabels) {
        queryClient.setQueryData<BskyContentLabelPrefs | null>(
          sifaQueryKeys.bskyPreferences.contentLabels(),
          result.contentLabels,
        );
      } else {
        // Even on failure, drop the cached value so the next read tries
        // again — a 403 might mean a fresh scope grant succeeded but the
        // local cache still reflects the pre-grant state.
        void queryClient.invalidateQueries({
          queryKey: sifaQueryKeys.bskyPreferences.all(),
        });
      }
    },
  });
}
