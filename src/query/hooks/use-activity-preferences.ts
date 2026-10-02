'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  fetchActivityPreferences,
  fetchSiteActivityPreset,
  updateActivityPreferences,
  type ActivityPreferences,
  type SiteActivityPresetResponse,
  type UpdateActivityPreferencesInput,
} from '../fetchers/activity-preferences.js';
import { sifaQueryKeys } from '../keys.js';

/** The authenticated user's own activity preferences. */
export function useActivityPreferences(
  options?: Omit<
    UseQueryOptions<
      ActivityPreferences | null,
      Error,
      ActivityPreferences | null,
      ReturnType<typeof sifaQueryKeys.activity.preferences>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.preferences(),
    queryFn: () => fetchActivityPreferences(config),
    ...options,
  });
}

/** Anyone's personal-site preset, by handle or DID. */
export function useSiteActivityPreset(
  handleOrDid: string | undefined | null,
  options?: Omit<
    UseQueryOptions<
      SiteActivityPresetResponse | null,
      Error,
      SiteActivityPresetResponse | null,
      ReturnType<typeof sifaQueryKeys.activity.sitePreset>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.activity.sitePreset(handleOrDid ?? ''),
    queryFn: () => fetchSiteActivityPreset(config, handleOrDid ?? ''),
    enabled: Boolean(handleOrDid) && (options?.enabled ?? true),
    ...options,
  });
}

/** Update the caller's own preferences, then refresh every activity query. */
export function useUpdateActivityPreferences(
  options?: Omit<
    UseMutationOptions<
      WriteResult<Partial<ActivityPreferences>>,
      Error,
      UpdateActivityPreferencesInput
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (input: UpdateActivityPreferencesInput) => updateActivityPreferences(config, input),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.activity.all() });
      }
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}
