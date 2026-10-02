'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchUserSettings,
  updateUserSettings,
  type UserSettings,
  type UserSettingsPatch,
} from '../fetchers/user-settings.js';
import { sifaQueryKeys } from '../keys.js';

/** The signed-in user's account preferences; `null` when signed out. */
export function useUserSettings(
  options?: Omit<
    UseQueryOptions<
      UserSettings | null,
      Error,
      UserSettings | null,
      ReturnType<typeof sifaQueryKeys.userSettings.all>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.userSettings.all(),
    queryFn: () => fetchUserSettings(config),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/**
 * Save one or more preferences, then write the stored result into the
 * settings cache. A failed save resolves to `null` and leaves the cache as is.
 */
export function useUpdateUserSettings() {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UserSettingsPatch) => updateUserSettings(config, patch),
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(sifaQueryKeys.userSettings.all(), settings);
    },
  });
}
