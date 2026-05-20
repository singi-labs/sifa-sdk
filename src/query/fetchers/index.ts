/**
 * Fetcher-only barrel for `@singi-labs/sifa-sdk/query/fetchers`.
 *
 * Pure, no React imports. Safe to import from Next.js React Server
 * Components, edge runtimes, and any other context where React hooks
 * are unavailable. Client components should import from
 * `@singi-labs/sifa-sdk/query` to get hooks + Provider too.
 *
 * Keep in sync with `../index.ts`: every fetcher exported there should
 * also be exported here. Hooks and the Provider live only in the
 * `/query` barrel.
 */

export {
  ApiError,
  apiFetch,
  apiFetchOrNull,
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type CreateResult,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

export { fetchAtFundLink, fetchProfile } from './profile.js';
export {
  deleteAvatarOverride,
  refreshPds,
  updateProfileOverride,
  updateProfileSelf,
  uploadAvatar,
  type ProfileIndustryInput,
  type ProfileSelfLocation,
  type RefreshPdsResult,
  type UpdateProfileOverrideInput,
  type UpdateProfileSelfInput,
  type UploadAvatarResult,
} from './profile-mutations.js';
export {
  createPosition,
  deletePosition,
  linkSkillToPosition,
  setPositionPrimary,
  unlinkSkillFromPosition,
  unsetPositionPrimary,
  updatePosition,
} from './positions.js';
export { createEducation, deleteEducation, updateEducation } from './education.js';
export { createSkill, deleteSkill, updateSkill } from './skills.js';
export { createRecord, deleteRecord, updateRecord } from './records.js';
export {
  createProfileLocation,
  deleteProfileLocation,
  updateProfileLocation,
  type ProfileLocationAddress,
  type ProfileLocationInput,
} from './profile-locations.js';
export {
  createExternalAccount,
  deleteExternalAccount,
  fetchExternalAccounts,
  setExternalAccountPrimary,
  unsetExternalAccountPrimary,
  updateExternalAccount,
  verifyExternalAccount,
  type CreateExternalAccountResult,
  type ExternalAccountInput,
  type VerifyExternalAccountResult,
} from './external-accounts.js';
export { createEndorsement, type EndorsementInput } from './endorsements.js';
export { hideKeytraceClaim, unhideKeytraceClaim } from './keytrace-claims.js';
export {
  bulkHideStandardPublications,
  bulkUnhideStandardPublications,
  hideOrcidPublication,
  hideSifaPublication,
  hideStandardPublication,
  refreshOrcidPublications,
  unhideOrcidPublication,
  unhideSifaPublication,
  unhideStandardPublication,
  type RefreshOrcidPublicationsResult,
} from './publications.js';
export { fetchStats, type StatsResponse } from './stats.js';
export {
  fetchAppsRegistry,
  fetchHiddenApps,
  type AppRegistryEntry,
  type FetchHiddenAppsOptions,
  type HiddenApp,
} from './apps.js';
export {
  fetchSearchFilters,
  fetchSearchProfiles,
  fetchSkillSuggestions,
  searchSkills,
  type FilterOptions,
  type ProfileSearchResult,
  type SearchFilters,
  type SearchResponse,
  type SkillSearchResult,
} from './search.js';
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
} from './discovery.js';
export { fetchFollowing, type FollowProfile, type FollowingResponse } from './follow.js';
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
} from './activity.js';
export { fetchEndorsementCount } from './endorsement.js';
export { fetchNetworkStreamCount, type FetchNetworkStreamCountOptions } from './stream.js';
export {
  checkAppAccount,
  createReaction,
  deleteReaction,
  fetchReactionStatus,
  type AccountCheckResult,
  type CheckAppAccountOptions,
  type FetchReactionStatusOptions,
  type ReactionError,
  type ReactionResult,
  type ReactionStatus,
} from './reactions.js';
export {
  QUOTED_POSTS_BATCH_MAX,
  resolveQuotedPosts,
  type QuotedPostAuthor,
  type QuotedPostImage,
  type QuotedPostResult,
  type QuotedPostView,
  type ResolveQuotedPostsOptions,
} from './quoted-posts.js';
export {
  castRoadmapVote,
  fetchMyRoadmapVotes,
  fetchRoadmapVotes,
  retractRoadmapVote,
  type FetchMyRoadmapVotesOptions,
  type RoadmapVoter,
  type RoadmapVotesResponse,
} from './roadmap.js';
export { deleteAccount, resetProfile, type DeleteAccountResult } from './destructive.js';
export {
  checkNetworkMapJobStatus,
  fetchNetworkMap,
  initiateNetworkMapGeneration,
  isNetworkMapResponse,
  type NetworkMapEdge,
  type NetworkMapGenerationJob,
  type NetworkMapGraphData,
  type NetworkMapNode,
  type NetworkMapPendingJob,
  type NetworkMapResponse,
} from './network-map.js';

export { sifaQueryKeys, type SifaQueryKey } from '../keys.js';
