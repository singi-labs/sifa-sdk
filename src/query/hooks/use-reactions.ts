'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  checkAppAccount,
  fetchReactionStatus,
  type AccountCheckResult,
  type ReactionStatus,
} from '../fetchers/reactions.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Batch-look up reaction status for multiple URIs. Skips the network call
 * when `uris` is empty.
 */
export function useReactionStatus(
  uris: string[],
  options?: Omit<
    UseQueryOptions<
      Record<string, ReactionStatus> | null,
      Error,
      Record<string, ReactionStatus> | null,
      ReturnType<typeof sifaQueryKeys.reactions.status>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.reactions.status(uris),
    queryFn: () => fetchReactionStatus(config, uris),
    ...options,
  });
}

/** Check whether the authenticated viewer has an account on the given app. */
export function useAppAccountCheck(
  appId: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      AccountCheckResult | null,
      Error,
      AccountCheckResult | null,
      ReturnType<typeof sifaQueryKeys.reactions.accountCheck>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.reactions.accountCheck(appId ?? ''),
    queryFn: () => checkAppAccount(config, appId ?? ''),
    enabled: Boolean(appId) && (options?.enabled ?? true),
    ...options,
  });
}
