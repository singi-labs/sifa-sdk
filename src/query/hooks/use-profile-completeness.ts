'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchProfileCompleteness,
  type ProfileCompleteness,
} from '../fetchers/profile-completeness.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Completeness of the signed-in user's own profile (which tracked signals are
 * missing), for the unified Inbox checklist. Returns a complete result when
 * signed out or on error.
 */
export function useProfileCompleteness(
  options?: Omit<
    UseQueryOptions<
      ProfileCompleteness,
      Error,
      ProfileCompleteness,
      ReturnType<typeof sifaQueryKeys.profile.completeness>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.profile.completeness(),
    queryFn: () => fetchProfileCompleteness(config),
    ...options,
  });
}
