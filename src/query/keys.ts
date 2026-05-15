/**
 * Query key factory for TanStack Query.
 *
 * Keys are read-only tuples; the hierarchy matches the SDK's fetcher
 * grouping. Use these instead of inline arrays so consumers can target
 * `queryClient.invalidateQueries({ queryKey: keys.profile.all() })` and
 * similar patterns without typos.
 *
 * Convention: every leaf key starts with the namespace ('sifa') so
 * consumers can invalidate everything Sifa-related in one call.
 */
export const sifaQueryKeys = {
  all: () => ['sifa'] as const,

  profile: {
    all: () => ['sifa', 'profile'] as const,
    byHandle: (handleOrDid: string) => ['sifa', 'profile', handleOrDid] as const,
  },

  position: {
    all: () => ['sifa', 'position'] as const,
    byOwner: (did: string) => ['sifa', 'position', 'by-owner', did] as const,
  },
} as const;

export type SifaQueryKey =
  | ReturnType<typeof sifaQueryKeys.all>
  | ReturnType<typeof sifaQueryKeys.profile.all>
  | ReturnType<typeof sifaQueryKeys.profile.byHandle>
  | ReturnType<typeof sifaQueryKeys.position.all>
  | ReturnType<typeof sifaQueryKeys.position.byOwner>;
