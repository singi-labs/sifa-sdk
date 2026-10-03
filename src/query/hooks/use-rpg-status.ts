'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchRpgStatus, type RpgStatusResponse } from '../fetchers/rpg.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * The signed-in user's rpg.actor status (`GET /api/rpg/status`): whether they
 * have a character, and their item progress. Pass `enabled: false` to hold
 * the request until it is needed, e.g. until an editor opens.
 */
export function useRpgStatus(
  options?: Omit<
    UseQueryOptions<
      RpgStatusResponse,
      Error,
      RpgStatusResponse,
      ReturnType<typeof sifaQueryKeys.rpg.status>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.rpg.status(),
    queryFn: () => fetchRpgStatus(config),
    ...options,
  });
}
