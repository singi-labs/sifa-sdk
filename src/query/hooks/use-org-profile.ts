'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type { OrgFloorVerdict, Profile } from '../../types/index.js';
import { useSifaConfig } from '../config.js';
import { fetchProfile } from '../fetchers/profile.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Read the server-computed org rendering-floor verdict for a handle or DID.
 *
 * The verdict rides the profile resolve (`GET /api/profile/:handleOrDid`), so
 * this hook reuses the `profile.byHandle` query key -- it shares the cache with
 * {@link useProfile} and never triggers a second round-trip. Returns
 * `OrgFloorVerdict | null` (`null` when the profile is missing or predates the
 * `org` field).
 */
export function useOrgProfile(
  handleOrDid: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      Profile | null,
      Error,
      OrgFloorVerdict | null,
      ReturnType<typeof sifaQueryKeys.profile.byHandle>
    >,
    'queryKey' | 'queryFn' | 'select'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.byHandle(handleOrDid ?? ''),
    queryFn: () => fetchProfile(config, handleOrDid ?? ''),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    select: (profile) => profile?.org ?? null,
    ...options,
  });
}
