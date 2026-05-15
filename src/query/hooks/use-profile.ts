'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type { Profile } from '../../types/index.js';
import { useSifaConfig } from '../config.js';
import { fetchAtFundLink, fetchProfile } from '../fetchers/profile.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook that reads an aggregated profile by handle or DID via
 * TanStack Query. Returns `null` data when the profile does not exist.
 *
 * Pass `{ enabled: false }` (or an empty `handleOrDid`) to defer the
 * fetch.
 */
export function useProfile(
  handleOrDid: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      Profile | null,
      Error,
      Profile | null,
      ReturnType<typeof sifaQueryKeys.profile.byHandle>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.byHandle(handleOrDid ?? ''),
    queryFn: () => fetchProfile(config, handleOrDid ?? ''),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * React hook for a profile's AT Fund link. Returns `null` data on error
 * or when the profile has no link configured.
 */
export function useAtFundLink(
  did: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      string | null,
      Error,
      string | null,
      ReturnType<typeof sifaQueryKeys.profile.atFundLink>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.atFundLink(did ?? ''),
    queryFn: () => fetchAtFundLink(config, did ?? ''),
    enabled: Boolean(did) && (options?.enabled ?? true),
    ...options,
  });
}
