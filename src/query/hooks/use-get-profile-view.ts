'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type { ProfileView } from '../../types/profile-view.js';
import { useSifaConfig } from '../config.js';
import { fetchGetProfileView } from '../fetchers/get-profile-view.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook that reads the aggregated public profile view via the
 * `id.sifa.getProfileView` XRPC query. Returns `null` data when the profile
 * does not exist.
 *
 * Pass `{ enabled: false }` (or an empty `actor`) to defer the fetch.
 */
export function useGetProfileView(
  actor: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      ProfileView | null,
      Error,
      ProfileView | null,
      ReturnType<typeof sifaQueryKeys.profile.view>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.view(actor ?? ''),
    queryFn: () => fetchGetProfileView(config, actor ?? ''),
    enabled: Boolean(actor) && (options?.enabled ?? true),
    ...options,
  });
}
