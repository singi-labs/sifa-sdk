# @singi-labs/sifa-sdk

## 0.7.9

### Patch Changes

- 4f33f04: Add optional `discoverable` field to `ProfileSelfRecordSchema` and the `Profile` type. Mirrors `id.sifa.profile.self.discoverable` (sifa-lexicons 0.6.1). Absence is treated as default-true. Consumers gate noindex / sitemap exclusion on `discoverable === false`.

## 0.7.8

### Patch Changes

- 9a7a8c7: Add profile dimensions logic alongside profile completeness. New exports from the main entry: `countFilledDimensions`, `dimensionsFromInputs`, `profileToDimensionInputs`, `getFilledDimensionsMap`, `MIN_SKILLS`, `DIMENSIONS_MAX_SCORE`, and the supporting types.

  This is the canonical source of truth for the 6-key dimension map (avatar, headline, about, currentPosition, skills, education) that the Sifa homepage uses to route between V3 ("building") and V4 ("established") variants. Lives in `src/logic/` next to the existing completeness scoring so both surfaces share one place to evolve.

  Existing in-place implementations in `sifa-web/src/lib/profile-dimensions.ts` will migrate to this SDK entry in a follow-up PR; sifa-api will start computing the same number on the session check by importing from the SDK so frontend and backend cannot drift on what "filled" means.

  Additive change. No existing exports modified.

## 0.7.7

### Patch Changes

- 998c195: Add `@singi-labs/sifa-sdk/tokens` subpath -- Sifa brand design tokens encoded from `Singi Labs/brand/design-system.md`.

  ### Why

  Phase 6.3 of the SDK extraction plan (revised 2026-05-16). Captures the design-system spec values as TS constants so the planned `sifa-app` (React Native) can consume the same brand foundations without forking. `sifa-web` already implements these in `globals.css`; Phase 6.4 will refactor it to source the strings from this module where Tailwind-4's CSS-first config permits.

  ### Exports

  ```ts
  import {
    colors,
    fonts,
    fontFallbackStacks,
    iconSet,
    iconWeights,
  } from '@singi-labs/sifa-sdk/tokens';

  colors.primary; // '#4385BE'  Flexoki Blue (Sifa accent)
  colors.secondary; // '#8B7EC8'  Flexoki Purple (shared)
  fonts.sans; // 'iA Writer Quattro'
  fonts.display; // 'Space Grotesk'
  fonts.mono; // 'Source Code Pro'
  fontFallbackStacks.sans; // "'iA Writer Quattro', -apple-system, ..."
  fontFallbackStacks.display; // "'Space Grotesk', 'iA Writer Quattro', system-ui, sans-serif"
  fontFallbackStacks.mono; // "'Source Code Pro', ui-monospace, ..."
  iconSet; // 'phosphor'
  iconWeights.uiChrome; // 'regular'
  iconWeights.interactive; // 'bold'
  iconWeights.decorative; // 'duotone'
  ```

  ### What's intentionally NOT in this module
  - **Neutral color scales** (background, surface, border, text). These come from Radix Colors at runtime via CSS variables; encoding them as TS constants would misrepresent how they're consumed.
  - **Spacing / breakpoint scales.** sifa-web uses Tailwind's defaults; no Sifa-specific scale exists yet. Add later if needed.
  - **CSS variable strings, Style Dictionary output, design-token JSON formats.** Decision baked in (2026-05-14, reaffirmed 2026-05-16): TS constants only. Consumers translate to their own format.

  ### Versioning

  Patch bump -- purely additive, no API changes elsewhere. (Per pre-1.0 convention: patches for additive changes; reserve minors for substantial milestones like closing out a whole phase.)

## 0.7.6

### Patch Changes

- f4eed30: Add `completenessScore` / `completenessPercent` / `COMPLETENESS_MAX_SCORE` + the `ProfileCompletion` type to the root barrel (Phase 6.2 -- business logic predicates).

  ### Why

  `profile-completeness.ts` previously lived in `sifa-web/src/lib/` with a comment noting it was "mirrored in sifa-api". Audit showed sifa-api builds the underlying `ProfileCompletion` shape inline (in SQL for admin-stats queries, in route handlers elsewhere) but didn't have a duplicate scoring function. Moving the function to the SDK establishes a canonical source of truth that both clients can consume going forward.

  ### What's exported

  ```ts
  import {
    COMPLETENESS_MAX_SCORE,
    completenessScore,
    completenessPercent,
    type ProfileCompletion,
  } from '@singi-labs/sifa-sdk';
  ```

  - `COMPLETENESS_MAX_SCORE` -- the total signal count (`6`)
  - `completenessScore(c: ProfileCompletion): number` -- integer 0..6
  - `completenessPercent(c: ProfileCompletion): number` -- rounded 0..100 (discrete: `{0, 17, 33, 50, 67, 83, 100}`)
  - `ProfileCompletion` -- shape: `{ hasHeadline, hasAbout, positionCount, educationCount, skillCount, certificationCount }`

  ### Layout

  New `src/logic/` subdirectory in the SDK; exported via the root barrel (no separate subpath -- only ~50 LOC, doesn't justify a subpath split). Follow-up phase 6.2 PRs will adopt this in sifa-web (delete local copy) and optionally in sifa-api (import the interface type for shape consistency).

  ### Versioning

  Patch bump -- purely additive.

## 0.7.5

### Patch Changes

- 4856729: Add optional flat location fields to the `Profile` type (`locationCountry`, `locationRegion`, `locationCity`, `locationLocality`, `countryCode`).

  ### Why

  sifa-api emits these fields at the response root during the additive response window for `community.lexicon.location.address`. The SDK's `Profile` type didn't declare them, forcing consumers (notably sifa-web's profile page and embed JSON route) to cast through `Profile & Partial<{...}>` at every read site. Declaring them on the type retires those casts.

  All five fields are marked `@deprecated` with JSDoc and point at the structured `locations[]` array (and the entry with `isPrimary: true`) as the canonical shape. The flat fields stay in the type until sifa-api drops them from the response.

  ### Type change

  ```ts
  export interface Profile {
    // ...
    location?: LocationValue | null;
    locations?: ProfileLocation[];

    /** @deprecated Prefer locations[].locationCountry */
    locationCountry?: string | null;
    /** @deprecated Prefer locations[].locationRegion */
    locationRegion?: string | null;
    /** @deprecated Legacy alias for locationLocality */
    locationCity?: string | null;
    /** @deprecated Prefer locations[].locationLocality */
    locationLocality?: string | null;
    /** @deprecated Prefer locations[].countryCode */
    countryCode?: string | null;
    // ...
  }
  ```

  ### Versioning

  Patch bump (additive, optional fields).

## 0.7.4

### Patch Changes

- 247ce08: Add `@singi-labs/sifa-sdk/query/fetchers` subpath export -- a pure, React-free entry point for Next.js React Server Components, edge runtimes, and any context where hooks are unavailable.

  ### Why

  The existing `/query` barrel bundles both pure fetchers and React-using hooks/Provider into a single output file. tsup's `splitting: false` config means the `'use client'` directives at the per-file level get merged into one big file with no directive, so consuming bundlers (notably Next.js RSC) evaluate the entire module on the server and trip on `createContext` from the Provider.

  This subpath exposes only the fetchers + types + the `apiFetch`/`apiWrite` helpers + the `sifaQueryKeys` factory. No React imports. Safe to import from RSC.

  ### Usage

  ```ts
  // Server Component
  import { fetchRoadmapVotes } from '@singi-labs/sifa-sdk/query/fetchers';

  const votes = await fetchRoadmapVotes({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });
  ```

  Client components continue importing from `@singi-labs/sifa-sdk/query` to get hooks + Provider.

  ### What's exported

  Every fetcher and type from the existing `/query` barrel: profile, profile-mutations, positions (CRUD + skill linking + primary), education, skills, generic records, profile-locations, external-accounts, endorsements, keytrace-claims, publications, stats, apps, search, discovery, follow, activity, endorsement count, network stream, reactions (read + write), quoted posts, roadmap (read + write), destructive ops. Plus `sifaQueryKeys`, `ApiError`, `apiFetch`, `apiFetchOrNull`, `apiWrite`, `apiWriteCreate`, and every related type.

  Excluded: `SifaProvider`, `useSifaConfig`, and every `use*` hook.

  ### Versioning

  Patch bump.

## 0.7.3

### Patch Changes

- 46eeb4c: Phase 5A.3 final -- reactions + roadmap + destructive mutations. Completes the sweep.

  ### Reactions
  - `createReaction(targetUri, appId, targetCid?)` / `useCreateReaction`. Returns a discriminated-union result instead of the generic `WriteResult` shape because reactions have a distinct `scope_insufficient` failure that triggers an OAuth scope-upgrade flow rather than an error toast. The hook surfaces `requiredScope` on `403 ScopeInsufficient` so the caller can re-authorize.
  - `deleteReaction(targetUri, appId)` / `useDeleteReaction` -- standard `WriteResult` shape.

  Both mutation hooks invalidate `sifaQueryKeys.reactions.all()` on success (any cached `useReactionStatus` view containing the affected URI needs a refresh).

  ### Roadmap
  - `castRoadmapVote(key)` / `useCastRoadmapVote`
  - `retractRoadmapVote(key)` / `useRetractRoadmapVote`

  Both invalidate `sifaQueryKeys.roadmap.all()` on success.

  ### Destructive operations
  - `resetProfile(deletePdsData)` / `useResetProfile` -- wipes the user's Sifa profile. Invalidates `sifaQueryKeys.all()` on success.
  - `deleteAccount(deletePdsData)` / `useDeleteAccount` -- deletes the account. Returns the deleted `handle` for confirmation UIs. Clears the entire query cache (`queryClient.clear()`) on success since the user is effectively logged out.

  `deletePdsData: true` also deletes the corresponding records on the user's PDS; `false` leaves them intact for possible re-indexing.

  ### Note on `requestReactionScope`

  `requestReactionScope` from `sifa-web/src/lib/reactions-api.ts` is **not** ported. It uses `sessionStorage` and `window.location` directly and is fundamentally browser-only; it stays in sifa-web's `web-internal-api.ts` when the 5B cleanup lands.

  ### Phase 5A.3 complete

  With this PR, every mutation from `sifa-web/src/lib/{profile-api,reactions-api,roadmap-votes-api}.ts` lives in the SDK. Next milestone: **Phase 5B** -- TanStack Query Provider integration in sifa-web, then the consumer sweep, then cleanup.

  ### Versioning

  Patch bump. PR 5 of 5 (final) in the Phase 5A.3 sweep.

- 4ec960f: Phase 5A.3 foundation -- write-mutation helpers, profile-core mutations, and a `createPosition` endpoint fix.

  ### New foundation in `@singi-labs/sifa-sdk/query`
  - **`apiWrite` / `apiWriteCreate` helpers** on the `client.js` module. Wrap `apiFetch` with the never-throws contract used by all sifa-web mutations: return a structured `WriteResult` (or `CreateResult`) on both success and failure, and preserve the `pdsHost` field when the AppView reports a PDS-side failure (issue #167).
  - **`WriteResult` / `CreateResult` types moved to `client.js`** and re-exported from `positions.js` for backwards compatibility. Shared across every mutation in this phase.

  ### Bug fix: `createPosition`
  - **Endpoint fixed:** was `POST /api/positions`, now correctly `POST /api/profile/position` (matches sifa-api).
  - **Return shape fixed:** the fetcher used to throw on errors; it now returns `{ success: false, error, pdsHost? }` like every other mutation. The hook contract is unchanged (still resolves the mutation; consumers inspect `result.success`).
  - The hook was unused in sifa-web, so this is not a breaking change in practice.

  ### New profile-core mutations (in `fetchers/profile-mutations.js`)
  - **`updateProfileSelf` / `useUpdateProfileSelf`** -- update the authenticated user's `id.sifa.profile.self` record (headline, about, industries, location, openTo, preferredWorkplace, availability).
  - **`updateProfileOverride` / `useUpdateProfileOverride`** -- override aggregated profile fields with sifa-specific values; `null` clears the override.
  - **`refreshPds` / `useRefreshPds`** -- re-pull `app.bsky.actor.profile` from the user's PDS. Returns freshly resolved `displayName` and `avatar`.
  - **`uploadAvatar` / `useUploadAvatar`** -- multipart upload (accepts `File` or `Blob`). 30s default timeout.
  - **`deleteAvatarOverride` / `useDeleteAvatarOverride`** -- revert to PDS avatar.

  All five hooks accept an `ownerHandleOrDid` argument so they can invalidate the correct profile cache entry on success. Each forwards the TanStack v5 four-arg `onSuccess` signature (`data, variables, onMutateResult, context`).

  ### New read: `searchSkills`
  - **`searchSkills` / `useCanonicalSkillSearch`** -- canonical-skill DB lookup at `/api/skills/search`. Distinct from the existing `fetchSkillSuggestions` (`/api/search/skills`), which is the profile-skill typeahead. Returns `[]` on empty input or any error.
  - New query key entry: `sifaQueryKeys.search.canonicalSkills(query, limit)`.

  ### Versioning

  Patch bump. This is PR 1 of 5 in the Phase 5A.3 mutation sweep; remaining PRs cover positions/education/skills, locations/external-accounts/endorsements, publications, and reactions/roadmap/destructive ops.

- eda7851: Phase 5A.3 locations -- profile locations + external accounts + endorsements + keytrace claims.

  ### Profile locations
  - `createProfileLocation`, `updateProfileLocation`, `deleteProfileLocation` and matching hooks.
  - `ProfileLocationAddress` payload accepts both `{country, locality}` (community.lexicon.location.address) and `{countryCode, city}` (legacy) during the migration; sifa-api's union schema resolves either.

  ### External accounts
  - `fetchExternalAccounts` / `useExternalAccounts` -- the read endpoint from `sifa-web/src/lib/profile-api.ts` (leftover from 5A.2b).
  - `createExternalAccount` / `useCreateExternalAccount` -- returns `rkey` AND the server-resolved `feedUrl` (sifa-api inspects the target for RSS feeds).
  - `updateExternalAccount`, `deleteExternalAccount` and matching hooks.
  - `setExternalAccountPrimary`, `unsetExternalAccountPrimary` and matching hooks.
  - `verifyExternalAccount` / `useVerifyExternalAccount` -- triggers server-side keytrace verification; returns `{ verified, verifiedVia }` on success.
  - New query key: `sifaQueryKeys.profile.externalAccounts(handleOrDid)`. External-account mutations invalidate both this key and `sifaQueryKeys.profile.byHandle`.

  ### Endorsements
  - `createEndorsement` / `useCreateEndorsement`. The hook takes the endorsed user's handle/DID (not the endorser's) so it can invalidate the right profile + endorsement-count caches.

  ### Keytrace claims
  - `hideKeytraceClaim`, `unhideKeytraceClaim` and matching hooks.

  ### Versioning

  Patch bump. PR 3 of 5 in the Phase 5A.3 sweep.

- 1175837: Phase 5A.3 publications -- hide/unhide for ORCID, standard, and Sifa-authored publications + ORCID refresh.

  ### ORCID publications
  - `hideOrcidPublication(config, putCode)` / `useHideOrcidPublication`
  - `unhideOrcidPublication(config, putCode)` / `useUnhideOrcidPublication`
  - `refreshOrcidPublications` / `useRefreshOrcidPublications` -- re-pulls the user's ORCID publications. Returns `{ added, removed }` counts. The server returns inline `{ error: '...' }` (not via HTTP status) on quota / linkage failures; the SDK folds that into `{ success: false, error }` to keep the contract consistent.

  ### Standard publications (auto-imported)
  - `hideStandardPublication(config, uri)` / `useHideStandardPublication`
  - `unhideStandardPublication(config, uri)` / `useUnhideStandardPublication`
  - `bulkHideStandardPublications(config, uris[])` / `useBulkHideStandardPublications`
  - `bulkUnhideStandardPublications(config, uris[])` / `useBulkUnhideStandardPublications`

  ### Sifa publications (`id.sifa.profile.publication`)
  - `hideSifaPublication(config, rkey)` / `useHideSifaPublication`
  - `unhideSifaPublication(config, rkey)` / `useUnhideSifaPublication`

  All hooks accept an `ownerHandleOrDid` argument for cache invalidation and forward the TanStack v5 four-arg `onSuccess` signature.

  ### Versioning

  Patch bump. PR 4 of 5 in the Phase 5A.3 sweep.

- 7d5a6bf: Phase 5A.3 sections -- generic record CRUD + positions/education/skills mutation surface.

  ### Generic record CRUD escape hatch

  For sections without a dedicated endpoint (certifications, projects, publications, volunteering, honors, languages, courses):
  - `createRecord(config, collection, data)` / `useCreateRecord`
  - `updateRecord(config, collection, rkey, data)` / `useUpdateRecord`
  - `deleteRecord(config, collection, rkey)` / `useDeleteRecord`

  Routes to `POST|PUT|DELETE /api/profile/records/<collection>/<rkey?>`.

  ### Position mutations (new)
  - `updatePosition`, `deletePosition` / `useUpdatePosition`, `useDeletePosition`
  - `setPositionPrimary`, `unsetPositionPrimary` / `useSetPositionPrimary`, `useUnsetPositionPrimary`
  - `linkSkillToPosition`, `unlinkSkillFromPosition` / `useLinkSkillToPosition`, `useUnlinkSkillFromPosition`. `link` is idempotent (no fetch when the skill is already linked) and strips `null` `location` from the PUT body so JSON.stringify drops it.

  ### Education mutations (new)
  - `createEducation`, `updateEducation`, `deleteEducation` and matching hooks.

  ### Skill mutations (new)
  - `createSkill`, `updateSkill`, `deleteSkill` and matching hooks.

  ### Hook contract

  All mutation hooks accept an `ownerHandleOrDid` argument for cache invalidation and forward the TanStack v5 four-arg `onSuccess` signature. Position hooks invalidate both `sifaQueryKeys.profile.byHandle(owner)` and `sifaQueryKeys.position.byOwner(owner)`. Other section hooks invalidate the profile cache only.

  ### Versioning

  Patch bump. PR 2 of 5 in the Phase 5A.3 sweep.

## 0.7.2

### Patch Changes

- 97debea: Add quoted-post batch resolution to `@singi-labs/sifa-sdk/query`:
  - **`resolveQuotedPosts(config, uris, options?)`** — batches AT-URIs into chunks of `QUOTED_POSTS_BATCH_MAX` (20) and fires them in parallel against `POST /api/quoted-posts/resolve`. Auto-deduplicates the input. Returns `Record<uri, QuotedPostResult>`; failed URIs are absent from the map. Supports `cookieHeader` for Next.js RSC server-side calls.
  - **Result types**: `QuotedPostView` (resolved snapshot — author, text, createdAt, optional images), `QuotedPostResult` (`'ok' | 'deleted' | 'unavailable'`), `QuotedPostAuthor`, `QuotedPostImage`, `ResolveQuotedPostsOptions`.
  - **`ActivityItem`** gains two optional fields: `quotedPost` (inlined when the server already resolved via the Bluesky AppView) and `quotedPostUri` (when the client needs to lazy-batch via this fetcher).

  These mirror the response contract added in `sifa-api` (issue singi-labs/sifa-workspace#178). Pairs with the consumer changes in `sifa-web`.

## 0.7.1

### Patch Changes

- 32a36eb: Add activity, endorsement count, and network stream count read endpoints to `@singi-labs/sifa-sdk/query`:
  - **Activity:** `fetchHeatmapData` / `useHeatmapData`, `fetchActivityTeaser` / `useActivityTeaser`, `fetchActivityFeed` / `useActivityFeed`. The teaser and feed support `cookieHeader` for RSC server-side calls; the teaser caps upstream wait at 8s so SSR cannot hang.
  - **Endorsements:** `fetchEndorsementCount` / `useEndorsementCount` -- count of confirmed endorsements for a DID. Returns 0 on error or unexpected shape.
  - **Stream:** `fetchNetworkStreamCount` / `useNetworkStreamCount` -- count of items in the authenticated user's network stream digest. Returns 0 on 404 (the endpoint may not be shipped yet) or any other error.

  Plus supporting result types (`HeatmapDay`, `HeatmapResponse`, `ActivityItem`, `ActivityTeaserResponse`, `ActivityFeedResponse`, `FetchActivityTeaserOptions`, `FetchActivityFeedOptions`, `FetchNetworkStreamCountOptions`) and query-key entries (`sifaQueryKeys.activity.*`, `sifaQueryKeys.endorsement.*`, `sifaQueryKeys.stream.*`).

  These mirror the existing endpoints in `sifa-web/src/lib/api.ts`. Behavior preserved including the safe-default error contracts (null / 0) and the response-shape guards on the count endpoints.

  Part of the Phase 5A.2b sifa-app readiness work. Reactions and roadmap reads follow in subsequent patch releases.

- 3a560e7: Add reactions read endpoints to `@singi-labs/sifa-sdk/query`:
  - **`fetchReactionStatus` / `useReactionStatus`** -- batch-look up reaction state for multiple URIs. Returns `{}` for an empty input (no network call) and `null` on any error.
  - **`checkAppAccount` / `useAppAccountCheck`** -- check whether the authenticated viewer has an account on a given ATproto app. Returns `null` on any error.

  Both fetchers support `cookieHeader` for Next.js RSC server-side calls.

  Plus supporting result types (`ReactionStatus`, `AccountCheckResult`, `FetchReactionStatusOptions`, `CheckAppAccountOptions`) and query-key entries (`sifaQueryKeys.reactions.*`: `all`, `status`, `accountCheck`).

  These mirror the read endpoints in `sifa-web/src/lib/reactions-api.ts`. Behavior preserved including the empty-input shortcut on `fetchReactionStatus` and the safe-default `null` error contract.

  Part of the Phase 5A.2b sifa-app readiness work. Roadmap reads follow in the next patch release; reactions mutations land separately in 5A.3.

- fd699ec: Add roadmap vote read endpoints to `@singi-labs/sifa-sdk/query`:
  - **`fetchRoadmapVotes` / `useRoadmapVotes`** -- public roadmap vote tallies keyed by item. Returns `{}` on any error.
  - **`fetchMyRoadmapVotes` / `useMyRoadmapVotes`** -- list of roadmap items the authenticated viewer has voted on. Returns `[]` on any error or when the response payload's `voted` field is missing. Supports `cookieHeader` for Next.js RSC server-side calls.

  Plus supporting result types (`RoadmapVoter`, `RoadmapVotesResponse`, `FetchMyRoadmapVotesOptions`) and query-key entries (`sifaQueryKeys.roadmap.*`: `all`, `votes`, `myVotes`).

  These mirror the read endpoints in `sifa-web/src/lib/roadmap-votes-api.ts`. Behavior preserved including the safe-default error contracts and the `data.voted` extraction guard.

  Completes the Phase 5A.2b read-endpoint sweep. Roadmap vote mutations (`castRoadmapVote`, `retractRoadmapVote`) land in 5A.3 alongside the other mutations.

- 0f4e378: Add stats, apps registry, hidden apps, and AT Fund link read endpoints to `@singi-labs/sifa-sdk/query`:
  - **Stats:** `fetchStats` / `useStats` -- public homepage stats (profile count, avatar samples, ATproto growth metrics).
  - **Apps:** `fetchAppsRegistry` / `useAppsRegistry` (public catalog of ATproto apps surfaced by Sifa), `fetchHiddenApps` / `useHiddenApps` (the authenticated user's hidden-apps list, with optional `cookieHeader` for RSC server-side calls).
  - **Profile:** `fetchAtFundLink` / `useAtFundLink` -- profile's AT Fund link, indexed by DID.

  Plus supporting result types (`StatsResponse`, `AppRegistryEntry`, `HiddenApp`, `FetchHiddenAppsOptions`) and query-key entries (`sifaQueryKeys.stats.*`, `sifaQueryKeys.apps.*`, `sifaQueryKeys.profile.atFundLink`).

  These mirror the existing endpoints in `sifa-web/src/lib/api.ts`. Behavior preserved including the safe-default error contracts (null / empty array) and the `cookieHeader` forwarding pattern for Next.js RSC server-side calls.

  Part of the Phase 5A.2b sifa-app readiness work. Remaining read endpoints (activity, reactions, roadmap) follow in subsequent patch releases; mutations land separately.

## 0.7.0

### Minor Changes

- 796bc66: Add discovery and search read endpoints to `@singi-labs/sifa-sdk/query`:
  - **Search:** `fetchSearchProfiles` / `useSearchProfiles`, `fetchSkillSuggestions` / `useSkillSuggestions`, `fetchSearchFilters` / `useSearchFilters`
  - **Discovery:** `fetchSimilarProfiles` / `useSimilarProfiles`, `fetchSuggestions` / `useSuggestions`, `fetchSuggestionCount` / `useSuggestionCount`, `fetchFeaturedProfile` / `useFeaturedProfile`
  - **Follow:** `fetchFollowing` / `useFollowing`

  Plus the supporting result types (`ProfileSearchResult`, `SearchFilters`, `SearchResponse`, `SkillSearchResult`, `FilterOptions`, `SimilarProfile`, `SuggestionProfile`, `SuggestionsResponse`, `FeaturedProfile`, `FollowProfile`, `FollowingResponse`) and query-key entries (`sifaQueryKeys.search.*`, `sifaQueryKeys.discovery.*`, `sifaQueryKeys.follow.*`).

  These mirror the read endpoints currently in `sifa-web/src/lib/api.ts`. Behavior preserved including the "no input, no fetch" shortcut on search and skill suggestions, the `cookieHeader` forwarding pattern for Next.js RSC server-side calls, and the safe-default error behavior (empty arrays / null / 0).

  Part of the Phase 5 sifa-app readiness work. Remaining read endpoints (activity, stats, reactions, roadmap, settings) follow in a subsequent release; mutations land separately.

## 0.6.0

### Minor Changes

- 6ef1c9e: Add the `@singi-labs/sifa-sdk/query` subpath: TanStack Query integration for the Sifa AppView.

  **Foundation:**
  - `apiFetch` / `apiFetchOrNull` — typed HTTP client with 429 retry, timeout, injectable `fetch`, Next.js cache hints, and `ApiError` for non-2xx
  - `SifaProvider` / `useSifaConfig` — React context for SDK configuration (`baseUrl`, optional custom `fetch`)
  - `sifaQueryKeys` — hierarchical query key factory rooted under `['sifa', ...]`

  **Pilot endpoints (more will be added in subsequent releases as part of the full migration):**
  - `fetchProfile` / `useProfile` — read a profile by handle or DID
  - `createPosition` / `useCreatePosition` — create a position record, invalidates owner profile cache on success

  **Peer dependencies (optional):** `@tanstack/react-query@^5.100.0` and `react@>=19`. The main SDK entry has no React dependency; only the `/query` subpath requires them.

  This is the foundation of the query layer for sifa-app and the SDK migration of sifa-web. Subsequent SDK releases will port the remaining ~60 sifa-api endpoints currently called from sifa-web.

## 0.5.0

### Minor Changes

- 7db1a24: Add Zod schemas for all 15 `id.sifa.*` record types: `ProfileSelf`, `ProfilePosition`, `ProfileEducation`, `ProfileSkill`, `ProfileCertification`, `ProfileCourse`, `ProfileExternalAccount`, `ProfileHonor`, `ProfileLanguage`, `ProfileProject`, `ProfilePublication`, `ProfileVolunteering`, `Endorsement`, `EndorsementConfirmation`, `GraphFollow`. Plus shared helpers for AT Protocol formats (`didSchema`, `atUriSchema`, `cidSchema`, `datetimeSchema`, `languageTagSchema`, `uriSchema`, `strongRefSchema`, `selfLabelsSchema`) and a grapheme-aware `maxGraphemes` refinement that matches the lexicon `maxGraphemes` semantic.

  Hand-written from the lexicon JSON. Each schema is exported from the main entry and via a new `./schemas` subpath. `knownValues` constraints are advisory per the lexicon spec -- unknown values are accepted.

  Adds `zod@4.4.3` as a pinned runtime dependency.

## 0.4.1

### Patch Changes

- c18ed17: `formatLocation` now prefers the new `locality` field (community.lexicon.location.address) over the legacy `city` slot, with a fallback to `city` so values produced before the sifa-api alias migration still render correctly during the additive transition window. No breaking change -- the fallback preserves existing behavior for callers that only set `city`.

## 0.4.0

### Minor Changes

- 74a8498: Export `findIndustry` and `getIndustryLabelKey` helpers from the taxonomy module. The functions already lived in the file (extracted as part of `industry-taxonomy.ts` in 0.1.0) but were not re-exported from the package barrel.

## 0.3.0

### Minor Changes

- 39ae35c: Add `LocationValue.locality` and `ProfileLocation.locationLocality` to mirror the `community.lexicon.location.address` field names. Both are optional and additive -- existing consumers that use `city` / `locationCity` continue to work during the sifa-api alias window (see singi-labs/sifa-api#440 / #441).

## 0.2.0

### Minor Changes

- 3172c1a: Add `employmentType?: string` to `ProfilePosition`. Mirrors the existing `id.sifa.defs#employmentType` lexicon field that the AppView has been indexing and returning for some time. Values are `id.sifa.defs#*` token URIs (e.g. `id.sifa.defs#fullTime`, `id.sifa.defs#fellowship`).

  Refs singi-labs/sifa-workspace#176.

## 0.1.0

### Minor Changes

- 581cd94: Extract pure formatting and parsing helpers from `sifa-web` into the SDK under `src/format/`:
  - `formatRelativeTime(dateString)` -- string-based, validates, returns `""` for invalid/future dates, has seconds + years buckets
  - `formatDistanceToNow(date: Date)` -- Date-based, returns `"just now"` for sub-minute, has weeks bucket, no years bucket
  - `truncateGraphemes(value, maxLen)` -- grapheme-aware truncation with ellipsis, emoji-safe
  - `sortByDateDesc(items, extract)` and the four extractors (`dateRangeExtractor`, `lexiconDateExtractor`, `singleDateExtractor`, `certDateExtractor`)
  - `formatLocation`, `parseLocationString`, `countryCodeToFlag`
  - `sanitizeHandleInput` -- strips `bsky.app/profile/`, `at://`, `@`, http(s)://; appends `.bsky.social` to bare usernames; preserves DIDs
  - PDS utilities: `pdsProviderFromApi`, `getHandleStem`, `getDisplayLabel`, `getPdsDisplayName`, `detectPdsProvider`, `PdsProvider` interface
  - WCAG contrast helpers: `isValidRgbColor`, `rgbToString`, `relativeLuminance`, `contrastRatio`, `meetsContrastAA`, `RgbColor` interface

  The two relative-time formatters are intentionally both exported -- they have different signatures, validation behavior, and output buckets. Picking a unified API is out of scope for this PR.

- 2d60366: Extract domain taxonomies from `sifa-web` into the SDK:
  - `CONTINENTS` + `getContinent(countryCode)` and `ContinentCode` union
  - `COUNTRIES` (ISO 3166-1 fallback list)
  - `INDUSTRY_OPTIONS` two-level taxonomy and `IndustryOption` type
  - `SKILL_CATEGORIES`, `SkillCategory`, `CATEGORY_ORDER`, `CATEGORY_LABELS` -- consolidated from two separate sources in `sifa-web`
  - `dedupeSkills` and `groupSkillsByCategory` plus `MergedProfileSkill` type
  - Platform data layer: `PLATFORM_LABELS`, `PLATFORM_OPTIONS`, `PlatformId`, `isKnownPlatform`, `getPlatformLabel`, `getFaviconUrl`

  Platform icon mapping stays platform-specific and remains in `sifa-web` (and will go into `sifa-app` separately) -- the SDK exposes the data, consumers map identifiers to their own icon components.

- 1485db4: Extract Sifa API response types from `sifa-web` into the SDK. Adds `Profile` and supporting interfaces (positions, education, skills, endorsements, locations, certifications, projects, publications, volunteering, honors, languages, courses, external accounts, trust stats, active apps, feed items, PDS provider info). Also adds the `LanguageProficiency` union and a few extracted nested interfaces (`PublicationContributor`, `ExternalAccountKeytraceClaim`, `ProfileIndustry`, `ProfileOverrideSource`). `SIFA_SDK_VERSION` is now injected at build time from `package.json`.
