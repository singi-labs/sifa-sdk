'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchRpgClaimable, type RpgClaimableResponse } from '../fetchers/rpg.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * How many rpg.actor items the signed-in user can claim right now, for the
 * Inbox item and the bell dropdown. Returns `{ count: 0 }` when signed out or
 * on error.
 */
export function useRpgClaimable(
  options?: Omit<
    UseQueryOptions<
      RpgClaimableResponse,
      Error,
      RpgClaimableResponse,
      ReturnType<typeof sifaQueryKeys.rpg.claimable>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.rpg.claimable(),
    queryFn: () => fetchRpgClaimable(config),
    ...options,
  });
}
