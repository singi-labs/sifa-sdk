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
    atFundLink: (did: string) => ['sifa', 'profile', 'at-fund-link', did] as const,
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

  stats: {
    all: () => ['sifa', 'stats'] as const,
    homepage: () => ['sifa', 'stats', 'homepage'] as const,
  },

  apps: {
    all: () => ['sifa', 'apps'] as const,
    registry: () => ['sifa', 'apps', 'registry'] as const,
    hidden: () => ['sifa', 'apps', 'hidden'] as const,
  },

  activity: {
    all: () => ['sifa', 'activity'] as const,
    heatmap: (handleOrDid: string, days: number) =>
      ['sifa', 'activity', 'heatmap', handleOrDid, days] as const,
    teaser: (handleOrDid: string) => ['sifa', 'activity', 'teaser', handleOrDid] as const,
    feed: (handleOrDid: string, opts: Record<string, unknown>) =>
      ['sifa', 'activity', 'feed', handleOrDid, opts] as const,
  },

  endorsement: {
    all: () => ['sifa', 'endorsement'] as const,
    count: (did: string) => ['sifa', 'endorsement', 'count', did] as const,
  },

  stream: {
    all: () => ['sifa', 'stream'] as const,
    networkCount: (did: string) => ['sifa', 'stream', 'network-count', did] as const,
  },

  reactions: {
    all: () => ['sifa', 'reactions'] as const,
    status: (uris: string[]) => ['sifa', 'reactions', 'status', uris] as const,
    accountCheck: (appId: string) => ['sifa', 'reactions', 'account-check', appId] as const,
  },

  roadmap: {
    all: () => ['sifa', 'roadmap'] as const,
    votes: () => ['sifa', 'roadmap', 'votes'] as const,
    myVotes: () => ['sifa', 'roadmap', 'my-votes'] as const,
  },
} as const;

export type SifaQueryKey =
  | ReturnType<typeof sifaQueryKeys.all>
  | ReturnType<typeof sifaQueryKeys.profile.all>
  | ReturnType<typeof sifaQueryKeys.profile.byHandle>
  | ReturnType<typeof sifaQueryKeys.profile.atFundLink>
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
  | ReturnType<typeof sifaQueryKeys.follow.following>
  | ReturnType<typeof sifaQueryKeys.stats.all>
  | ReturnType<typeof sifaQueryKeys.stats.homepage>
  | ReturnType<typeof sifaQueryKeys.apps.all>
  | ReturnType<typeof sifaQueryKeys.apps.registry>
  | ReturnType<typeof sifaQueryKeys.apps.hidden>
  | ReturnType<typeof sifaQueryKeys.activity.all>
  | ReturnType<typeof sifaQueryKeys.activity.heatmap>
  | ReturnType<typeof sifaQueryKeys.activity.teaser>
  | ReturnType<typeof sifaQueryKeys.activity.feed>
  | ReturnType<typeof sifaQueryKeys.endorsement.all>
  | ReturnType<typeof sifaQueryKeys.endorsement.count>
  | ReturnType<typeof sifaQueryKeys.stream.all>
  | ReturnType<typeof sifaQueryKeys.stream.networkCount>
  | ReturnType<typeof sifaQueryKeys.reactions.all>
  | ReturnType<typeof sifaQueryKeys.reactions.status>
  | ReturnType<typeof sifaQueryKeys.reactions.accountCheck>
  | ReturnType<typeof sifaQueryKeys.roadmap.all>
  | ReturnType<typeof sifaQueryKeys.roadmap.votes>
  | ReturnType<typeof sifaQueryKeys.roadmap.myVotes>;
