'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchUnlinkedPositions,
  type UnlinkedPositionsResult,
} from '../fetchers/unlinked-positions.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Positions on the signed-in user's profile whose company is not yet linked to a
 * canonical entity, for the unified Inbox. Returns an empty list when signed out
 * or on error.
 */
export function useUnlinkedPositions(
  options?: Omit<
    UseQueryOptions<
      UnlinkedPositionsResult,
      Error,
      UnlinkedPositionsResult,
      ReturnType<typeof sifaQueryKeys.position.unlinked>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.position.unlinked(),
    queryFn: () => fetchUnlinkedPositions(config),
    ...options,
  });
}
