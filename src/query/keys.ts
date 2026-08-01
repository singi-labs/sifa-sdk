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
    view: (actor: string) => ['sifa', 'profile', 'view', actor] as const,
    externalAccounts: (handleOrDid: string) =>
      ['sifa', 'profile', 'external-accounts', handleOrDid] as const,
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
    canonicalSkills: (query: string, limit: number) =>
      ['sifa', 'search', 'canonical-skills', query, limit] as const,
    filters: () => ['sifa', 'search', 'filters'] as const,
  },

  entity: {
    all: () => ['sifa', 'entity'] as const,
    search: (query: string, limit: number) => ['sifa', 'entity', 'search', query, limit] as const,
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
    followers: (handle: string) => ['sifa', 'follow', 'followers', handle] as const,
    followingOf: (handle: string) => ['sifa', 'follow', 'following-of', handle] as const,
    feed: (opts: Record<string, unknown>) => ['sifa', 'follow', 'feed', opts] as const,
    mutuals: (handle: string) => ['sifa', 'follow', 'mutuals', handle] as const,
    blueskySuggestions: () => ['sifa', 'follow', 'bluesky-suggestions'] as const,
  },

  admin: {
    all: () => ['sifa', 'admin'] as const,
    featureAllowlist: (flag: string) => ['sifa', 'admin', 'feature-allowlist', flag] as const,
    reviewQueues: () => ['sifa', 'admin', 'review-queues'] as const,
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

  github: {
    all: () => ['sifa', 'github'] as const,
    myPullRequests: (opts: { limit?: number; offset?: number }) =>
      ['sifa', 'github', 'my-pull-requests', opts] as const,
  },

  endorsement: {
    all: () => ['sifa', 'endorsement'] as const,
    count: (did: string) => ['sifa', 'endorsement', 'count', did] as const,
    // Scoped to the session rather than a DID -- the AppView reads the subject
    // from the session cookie, so there is only ever one inbox per client.
    pending: () => ['sifa', 'endorsement', 'pending'] as const,
  },

  confirmation: {
    all: () => ['sifa', 'confirmation'] as const,
    // Scoped to the session for the same reason as the endorsement inbox: the
    // AppView reads the subject from the session cookie, so there is only ever
    // one inbox per client.
    pending: () => ['sifa', 'confirmation', 'pending'] as const,
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

  bskyPreferences: {
    all: () => ['sifa', 'bsky-preferences'] as const,
    contentLabels: () => ['sifa', 'bsky-preferences', 'content-labels'] as const,
  },

  destructive: {
    all: () => ['sifa', 'destructive'] as const,
    wipePreview: () => ['sifa', 'destructive', 'wipe-preview'] as const,
  },
} as const;

export type SifaQueryKey =
  | ReturnType<typeof sifaQueryKeys.all>
  | ReturnType<typeof sifaQueryKeys.profile.all>
  | ReturnType<typeof sifaQueryKeys.profile.byHandle>
  | ReturnType<typeof sifaQueryKeys.profile.atFundLink>
  | ReturnType<typeof sifaQueryKeys.profile.externalAccounts>
  | ReturnType<typeof sifaQueryKeys.position.all>
  | ReturnType<typeof sifaQueryKeys.position.byOwner>
  | ReturnType<typeof sifaQueryKeys.search.all>
  | ReturnType<typeof sifaQueryKeys.search.profiles>
  | ReturnType<typeof sifaQueryKeys.search.canonicalSkills>
  | ReturnType<typeof sifaQueryKeys.search.skills>
  | ReturnType<typeof sifaQueryKeys.search.filters>
  | ReturnType<typeof sifaQueryKeys.entity.all>
  | ReturnType<typeof sifaQueryKeys.entity.search>
  | ReturnType<typeof sifaQueryKeys.discovery.all>
  | ReturnType<typeof sifaQueryKeys.discovery.similar>
  | ReturnType<typeof sifaQueryKeys.discovery.suggestions>
  | ReturnType<typeof sifaQueryKeys.discovery.suggestionCount>
  | ReturnType<typeof sifaQueryKeys.discovery.featured>
  | ReturnType<typeof sifaQueryKeys.follow.all>
  | ReturnType<typeof sifaQueryKeys.follow.following>
  | ReturnType<typeof sifaQueryKeys.follow.followers>
  | ReturnType<typeof sifaQueryKeys.follow.followingOf>
  | ReturnType<typeof sifaQueryKeys.follow.feed>
  | ReturnType<typeof sifaQueryKeys.follow.mutuals>
  | ReturnType<typeof sifaQueryKeys.follow.blueskySuggestions>
  | ReturnType<typeof sifaQueryKeys.admin.all>
  | ReturnType<typeof sifaQueryKeys.admin.featureAllowlist>
  | ReturnType<typeof sifaQueryKeys.admin.reviewQueues>
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
  | ReturnType<typeof sifaQueryKeys.endorsement.pending>
  | ReturnType<typeof sifaQueryKeys.confirmation.all>
  | ReturnType<typeof sifaQueryKeys.confirmation.pending>
  | ReturnType<typeof sifaQueryKeys.stream.all>
  | ReturnType<typeof sifaQueryKeys.stream.networkCount>
  | ReturnType<typeof sifaQueryKeys.reactions.all>
  | ReturnType<typeof sifaQueryKeys.reactions.status>
  | ReturnType<typeof sifaQueryKeys.reactions.accountCheck>
  | ReturnType<typeof sifaQueryKeys.roadmap.all>
  | ReturnType<typeof sifaQueryKeys.roadmap.votes>
  | ReturnType<typeof sifaQueryKeys.roadmap.myVotes>
  | ReturnType<typeof sifaQueryKeys.bskyPreferences.all>
  | ReturnType<typeof sifaQueryKeys.bskyPreferences.contentLabels>
  | ReturnType<typeof sifaQueryKeys.destructive.all>
  | ReturnType<typeof sifaQueryKeys.destructive.wipePreview>;
