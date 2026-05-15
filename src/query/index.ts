export {
  ApiError,
  apiFetch,
  apiFetchOrNull,
  type ApiFetchOptions,
  type SifaApiConfig,
} from './client.js';
export { SifaProvider, useSifaConfig, type SifaProviderProps } from './config.js';

export { fetchAtFundLink, fetchProfile } from './fetchers/profile.js';
export { createPosition, type CreateResult, type WriteResult } from './fetchers/positions.js';
export { fetchStats, type StatsResponse } from './fetchers/stats.js';
export {
  fetchAppsRegistry,
  fetchHiddenApps,
  type AppRegistryEntry,
  type FetchHiddenAppsOptions,
  type HiddenApp,
} from './fetchers/apps.js';
export {
  fetchSearchFilters,
  fetchSearchProfiles,
  fetchSkillSuggestions,
  type FilterOptions,
  type ProfileSearchResult,
  type SearchFilters,
  type SearchResponse,
  type SkillSearchResult,
} from './fetchers/search.js';
export {
  fetchFeaturedProfile,
  fetchSimilarProfiles,
  fetchSuggestionCount,
  fetchSuggestions,
  type FeaturedProfile,
  type FetchSuggestionsOptions,
  type SimilarProfile,
  type SuggestionProfile,
  type SuggestionsResponse,
} from './fetchers/discovery.js';
export { fetchFollowing, type FollowProfile, type FollowingResponse } from './fetchers/follow.js';
export {
  fetchActivityFeed,
  fetchActivityTeaser,
  fetchHeatmapData,
  type ActivityFeedResponse,
  type ActivityItem,
  type ActivityTeaserResponse,
  type FetchActivityFeedOptions,
  type FetchActivityTeaserOptions,
  type HeatmapDay,
  type HeatmapResponse,
} from './fetchers/activity.js';
export { fetchEndorsementCount } from './fetchers/endorsement.js';
export { fetchNetworkStreamCount, type FetchNetworkStreamCountOptions } from './fetchers/stream.js';

export { useAtFundLink, useProfile } from './hooks/use-profile.js';
export { useCreatePosition } from './hooks/use-create-position.js';
export { useStats } from './hooks/use-stats.js';
export { useAppsRegistry, useHiddenApps } from './hooks/use-apps.js';
export { useSearchFilters, useSearchProfiles, useSkillSuggestions } from './hooks/use-search.js';
export {
  useFeaturedProfile,
  useSimilarProfiles,
  useSuggestionCount,
  useSuggestions,
} from './hooks/use-discovery.js';
export { useFollowing } from './hooks/use-follow.js';
export { useActivityFeed, useActivityTeaser, useHeatmapData } from './hooks/use-activity.js';
export { useEndorsementCount } from './hooks/use-endorsement.js';
export { useNetworkStreamCount } from './hooks/use-stream.js';

export { sifaQueryKeys, type SifaQueryKey } from './keys.js';
