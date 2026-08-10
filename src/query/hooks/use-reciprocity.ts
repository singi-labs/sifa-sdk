'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchReciprocityCandidate, type ReciprocityCandidate } from '../fetchers/reciprocity.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Someone the signed-in user could endorse. `null` when there is nobody left.
 *
 * Session-scoped like the pending inbox: the AppView reads the viewer from the
 * session, so the key takes no DID. Invalidate it after dismissing to pull the
 * next person in without a reload.
 */
export function useReciprocityCandidate(
  options?: Omit<
    UseQueryOptions<
      ReciprocityCandidate | null,
      Error,
      ReciprocityCandidate | null,
      ReturnType<typeof sifaQueryKeys.endorsement.reciprocity>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.endorsement.reciprocity(),
    queryFn: () => fetchReciprocityCandidate(config),
    ...options,
  });
}
