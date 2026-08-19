'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { fetchAccounts, type AccountSummary } from '../fetchers/accounts.js';
import { sifaQueryKeys } from '../keys.js';

/**
 * React hook for the accounts attached to this browser (the account switcher).
 * Requires a client-side session (relies on `credentials: 'include'`).
 * Returns `[]` when unauthenticated.
 */
export function useAccounts(
  options?: Omit<
    UseQueryOptions<
      AccountSummary[],
      Error,
      AccountSummary[],
      ReturnType<typeof sifaQueryKeys.auth.accounts>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.auth.accounts(),
    queryFn: () => fetchAccounts(config),
    ...options,
  });
}
