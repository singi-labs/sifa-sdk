export {
  ApiError,
  apiFetch,
  apiFetchOrNull,
  type ApiFetchOptions,
  type SifaApiConfig,
} from './client.js';
export { SifaProvider, useSifaConfig, type SifaProviderProps } from './config.js';

export { fetchProfile } from './fetchers/profile.js';
export { createPosition, type CreateResult, type WriteResult } from './fetchers/positions.js';
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

export { useProfile } from './hooks/use-profile.js';
export { useCreatePosition } from './hooks/use-create-position.js';
export { useSearchFilters, useSearchProfiles, useSkillSuggestions } from './hooks/use-search.js';
export {
  useFeaturedProfile,
  useSimilarProfiles,
  useSuggestionCount,
  useSuggestions,
} from './hooks/use-discovery.js';
export { useFollowing } from './hooks/use-follow.js';

export { sifaQueryKeys, type SifaQueryKey } from './keys.js';
