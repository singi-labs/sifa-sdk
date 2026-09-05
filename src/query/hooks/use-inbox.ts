'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchInboxCounts, type InboxCounts } from '../fetchers/inbox.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * Combined inbox counts (`tasks` + `unreadNotifications`) for the header bell.
 * Returns zeros when signed out or on error, so the bell renders "nothing
 * waiting" without special-casing. See {@link InboxCounts} for what `tasks`
 * covers and why the two numbers are disjoint.
 */
export function useInboxCounts(
  options?: Omit<
    UseQueryOptions<InboxCounts, Error, InboxCounts, ReturnType<typeof sifaQueryKeys.inbox.counts>>,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.inbox.counts(),
    queryFn: () => fetchInboxCounts(config),
    ...options,
  });
}
