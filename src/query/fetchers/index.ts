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
export { fetchGetProfileView } from './get-profile-view.js';
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
export {
  createEndorsement,
  confirmEndorsement,
  type EndorsementInput,
  type ConfirmEndorsementInput,
} from './endorsements.js';
export {
  fetchPendingEndorsements,
  dismissEndorsement,
  type PendingEndorsement,
  type PendingEndorsementsPage,
  type DismissEndorsementInput,
} from './endorsement-inbox.js';
export {
  fetchPendingConfirmations,
  fetchGivenConfirmations,
  createConfirmation,
  dismissConfirmation,
  revokeConfirmation,
  type PendingConfirmation,
  type PendingConfirmationsPage,
  type GivenConfirmation,
  type ConfirmationInput,
  type ConfirmationSubjectInput,
} from './confirmations.js';
export { hideKeytraceClaim, unhideKeytraceClaim } from './keytrace-claims.js';
export { revealMarqueDomain, unrevealMarqueDomain } from './marque-domains.js';
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
export {
  bulkHideProfileItems,
  bulkUnhideProfileItems,
  hideProfileItem,
  unhideProfileItem,
  HIDDEN_ITEM_SOURCES,
  HIDDEN_ITEM_TYPES,
  type BulkHideProfileItemInput,
  type HiddenItemSource,
  type HiddenItemType,
  type HideProfileItemInput,
} from './profile-items-hide.js';
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
export {
  fetchFollowing,
  followUser,
  getFollowers,
  getFollowing,
  getFollowingFeed,
  unfollowUser,
  type FetchFollowListOptions,
  type FetchFollowingFeedOptions,
  type FollowListPage,
  type FollowProfile,
  type FollowUserResult,
  type FollowingResponse,
} from './follow.js';
export {
  getBlueskySuggestions,
  getMutuals,
  type FetchFollowProfilePageOptions,
  type FollowProfilePageResponse,
} from './follow-extras.js';
export {
  addFeatureAllowlist,
  listFeatureAllowlist,
  removeFeatureAllowlist,
  type FeatureAllowlistResponse,
  type ListFeatureAllowlistOptions,
} from './admin-feature-allowlists.js';
export {
  getAdminReviewQueues,
  type AdminReviewQueues,
  type GetAdminReviewQueuesOptions,
} from './admin-review-queues.js';
export {
  fetchActivityFeed,
  fetchActivityTeaser,
  fetchHeatmapData,
  type ActivityFeedResponse,
  type ActivityItem,
  type ActivityItemLinkHealth,
  type ActivityTeaserResponse,
  type FetchActivityFeedOptions,
  type FetchActivityTeaserOptions,
  type HeatmapDay,
  type HeatmapResponse,
} from './activity.js';
export {
  fetchMyGithubPullRequests,
  type GithubPullRequest,
  type MyGithubPullRequestsResponse,
  type FetchMyGithubPullRequestsOptions,
} from './github-prs.js';
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
  type CastRoadmapVoteResult,
  type FetchMyRoadmapVotesOptions,
  type RoadmapVoteError,
  type RoadmapVoteResult,
  type RoadmapVoter,
  type RoadmapVotesResponse,
} from './roadmap.js';
export {
  deleteAccount,
  fetchWipePreview,
  resetProfile,
  type DeleteAccountResult,
  type ResetProfileResult,
  type PdsWipeOutcome,
  type WipePreview,
} from './destructive.js';
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

export { fetchEntitySearch, selectEntity, importSearchEntities } from './entities.js';

export {
  submitOrgClaim,
  updateOrgProfile,
  requestOrgDomainChallenge,
  verifyOrgDomain,
  addOrgNotificationEmail,
  removeOrgNotificationEmail,
  type OrgClaimBinding,
  type OrgProfileEcho,
  type OrgClaimResult,
  type OrgProfileUpdateResult,
  type OrgDomainChallengeResult,
  type OrgDomainVerifyResult,
  type OrgNotificationEmailAddResult,
  type OrgNotificationEmailRemoveResult,
} from './org.js';

export { fetchProfileSummary } from './profile-summary.js';

export { sifaQueryKeys, type SifaQueryKey } from '../keys.js';
