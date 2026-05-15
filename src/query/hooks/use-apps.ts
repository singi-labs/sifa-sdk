'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchAppsRegistry,
  fetchHiddenApps,
  type AppRegistryEntry,
  type HiddenApp,
} from '../fetchers/apps.js';
import { sifaQueryKeys } from '../keys.js';

/** React hook for the public app registry. */
export function useAppsRegistry(
  options?: Omit<
    UseQueryOptions<
      AppRegistryEntry[],
      Error,
      AppRegistryEntry[],
      ReturnType<typeof sifaQueryKeys.apps.registry>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.apps.registry(),
    queryFn: () => fetchAppsRegistry(config),
    ...options,
  });
}

/**
 * React hook for the authenticated user's hidden-apps list. Requires a
 * client-side session (relies on `credentials: 'include'`).
 */
export function useHiddenApps(
  options?: Omit<
    UseQueryOptions<HiddenApp[], Error, HiddenApp[], ReturnType<typeof sifaQueryKeys.apps.hidden>>,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.apps.hidden(),
    queryFn: () => fetchHiddenApps(config),
    ...options,
  });
}
