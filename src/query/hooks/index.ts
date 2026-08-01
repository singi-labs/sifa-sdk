/**
 * Hook-only barrel for `@singi-labs/sifa-sdk/query/hooks`.
 *
 * Re-exports every hook plus the Provider so consumers can do
 * `import { useFollow, SifaProvider } from '@singi-labs/sifa-sdk/query/hooks'`.
 * The full `/query` barrel re-exports these plus the fetcher layer; this
 * subpath is for callers who want the hook surface only.
 *
 * Keep in sync with `../index.ts` — every hook exported there should
 * also be exported here.
 */

export { SifaProvider, useSifaConfig, type SifaProviderProps } from '../config.js';

export { useAtFundLink, useProfile } from './use-profile.js';
export { useGetProfileView } from './use-get-profile-view.js';
export {
  useDeleteAvatarOverride,
  useRefreshPds,
  useUpdateProfileOverride,
  useUpdateProfileSelf,
  useUploadAvatar,
} from './use-profile-mutations.js';
export { useCreatePosition } from './use-create-position.js';
export {
  useDeletePosition,
  useLinkSkillToPosition,
  useSetPositionPrimary,
  useUnlinkSkillFromPosition,
  useUnsetPositionPrimary,
  useUpdatePosition,
  type PositionSkillLinkVariables,
  type UpdatePositionVariables,
} from './use-position-mutations.js';
export {
  useCreateEducation,
  useDeleteEducation,
  useUpdateEducation,
  type UpdateEducationVariables,
} from './use-education-mutations.js';
export {
  useCreateSkill,
  useDeleteSkill,
  useUpdateSkill,
  useUpdateSkillSubCategories,
  type UpdateSkillVariables,
  type UpdateSkillSubCategoriesVariables,
} from './use-skill-mutations.js';
export {
  useCreateRecord,
  useDeleteRecord,
  useUpdateRecord,
  type CreateRecordVariables,
  type DeleteRecordVariables,
  type UpdateRecordVariables,
} from './use-record-mutations.js';
export {
  useCreateProfileLocation,
  useDeleteProfileLocation,
  useUpdateProfileLocation,
  type UpdateProfileLocationVariables,
} from './use-location-mutations.js';
export {
  useCreateExternalAccount,
  useDeleteExternalAccount,
  useExternalAccounts,
  useSetExternalAccountPrimary,
  useUnsetExternalAccountPrimary,
  useUpdateExternalAccount,
  useVerifyExternalAccount,
  type UpdateExternalAccountVariables,
} from './use-external-accounts.js';
export { useCreateEndorsement } from './use-endorsement-mutations.js';
export {
  usePendingConfirmations,
  useGivenConfirmations,
  useCreateConfirmation,
  useDismissConfirmation,
  useRevokeConfirmation,
} from './use-confirmations.js';
export { useHideKeytraceClaim, useUnhideKeytraceClaim } from './use-keytrace-claims.js';
export { useRevealMarqueDomain, useUnrevealMarqueDomain } from './use-marque-domains.js';
export {
  useBulkHideStandardPublications,
  useBulkUnhideStandardPublications,
  useHideOrcidPublication,
  useHideSifaPublication,
  useHideStandardPublication,
  useRefreshOrcidPublications,
  useUnhideOrcidPublication,
  useUnhideSifaPublication,
  useUnhideStandardPublication,
} from './use-publication-mutations.js';
export {
  useBulkHideProfileItems,
  useBulkUnhideProfileItems,
  useHideProfileItem,
  useUnhideProfileItem,
} from './use-profile-items-hide.js';
export { useStats } from './use-stats.js';
export { useAppsRegistry, useHiddenApps } from './use-apps.js';
export {
  useCanonicalSkillSearch,
  useSearchFilters,
  useSearchProfiles,
  useSkillSuggestions,
} from './use-search.js';
export {
  useFeaturedProfile,
  useSimilarProfiles,
  useSuggestionCount,
  useSuggestions,
} from './use-discovery.js';
export {
  useFollow,
  useFollowers,
  useFollowing,
  useFollowingFeed,
  useFollowingList,
  useUnfollow,
  type FollowVariables,
  type UnfollowVariables,
} from './use-follow.js';
export { useBlueskySuggestions, useMutuals } from './use-follow-extras.js';
export {
  useAddFeatureAllowlist,
  useFeatureAllowlist,
  useRemoveFeatureAllowlist,
  type AddFeatureAllowlistVariables,
  type RemoveFeatureAllowlistVariables,
} from './use-feature-allowlist.js';
export { useActivityFeed, useActivityTeaser, useHeatmapData } from './use-activity.js';
export { useMyGithubPullRequests, type UseMyGithubPullRequestsParams } from './use-github-prs.js';
export { useEndorsementCount } from './use-endorsement.js';
export { useNetworkStreamCount } from './use-stream.js';
export { useAppAccountCheck, useReactionStatus } from './use-reactions.js';
export {
  useCreateReaction,
  useDeleteReaction,
  type CreateReactionVariables,
  type DeleteReactionVariables,
} from './use-reaction-mutations.js';
export { useMyRoadmapVotes, useRoadmapVotes } from './use-roadmap.js';
export { useCastRoadmapVote, useRetractRoadmapVote } from './use-roadmap-mutations.js';
export { useDeleteAccount, useResetProfile, useWipePreview } from './use-destructive.js';

export {
  useEntitySearch,
  useSelectEntity,
  useImportSearchEntities,
  useDebouncedValue,
  type UseEntitySearchOptions,
} from './use-entity-search.js';

export { useOrgProfile } from './use-org-profile.js';
export { useOrgClaim } from './use-org-claim.js';
export { useUpdateOrgProfile } from './use-org-profile-settings.js';
export { useOrgDomainChallenge, useOrgDomainVerify } from './use-org-domains.js';
export {
  useAddOrgNotificationEmail,
  useRemoveOrgNotificationEmail,
} from './use-org-notification-emails.js';

export { sifaQueryKeys, type SifaQueryKey } from '../keys.js';
