# @singi-labs/sifa-sdk

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
