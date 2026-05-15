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

  search: {
    all: () => ['sifa', 'search'] as const,
    profiles: (filters: Record<string, unknown>) =>
      ['sifa', 'search', 'profiles', filters] as const,
    skills: (query: string) => ['sifa', 'search', 'skills', query] as const,
    filters: () => ['sifa', 'search', 'filters'] as const,
  },

  discovery: {
    all: () => ['sifa', 'discovery'] as const,
    similar: (did: string, limit: number) => ['sifa', 'discovery', 'similar', did, limit] as const,
    suggestions: (opts: Record<string, unknown>) =>
      ['sifa', 'discovery', 'suggestions', opts] as const,
    suggestionCount: (since: string | undefined) =>
      ['sifa', 'discovery', 'suggestion-count', since ?? null] as const,
    featured: () => ['sifa', 'discovery', 'featured'] as const,
  },

  follow: {
    all: () => ['sifa', 'follow'] as const,
    following: (opts: Record<string, unknown>) => ['sifa', 'follow', 'following', opts] as const,
  },
} as const;

export type SifaQueryKey =
  | ReturnType<typeof sifaQueryKeys.all>
  | ReturnType<typeof sifaQueryKeys.profile.all>
  | ReturnType<typeof sifaQueryKeys.profile.byHandle>
  | ReturnType<typeof sifaQueryKeys.position.all>
  | ReturnType<typeof sifaQueryKeys.position.byOwner>
  | ReturnType<typeof sifaQueryKeys.search.all>
  | ReturnType<typeof sifaQueryKeys.search.profiles>
  | ReturnType<typeof sifaQueryKeys.search.skills>
  | ReturnType<typeof sifaQueryKeys.search.filters>
  | ReturnType<typeof sifaQueryKeys.discovery.all>
  | ReturnType<typeof sifaQueryKeys.discovery.similar>
  | ReturnType<typeof sifaQueryKeys.discovery.suggestions>
  | ReturnType<typeof sifaQueryKeys.discovery.suggestionCount>
  | ReturnType<typeof sifaQueryKeys.discovery.featured>
  | ReturnType<typeof sifaQueryKeys.follow.all>
  | ReturnType<typeof sifaQueryKeys.follow.following>;
