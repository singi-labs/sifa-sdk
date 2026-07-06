# @singi-labs/sifa-sdk

## 0.11.13

### Patch Changes

- a1c1ed1: Talks & sessions CSV import: `normalizePresentationRole` now drops an unrecognized role instead of storing it raw, and maps free-text or compound roles (e.g. "Event host/moderator", "Organizer & co-host/moderator") to the nearest known token by keyword. An organizer-only value has no speaking token and is dropped. This keeps a fixed role dropdown from having to render arbitrary strings, matching `normalizePresentationMode`'s drop-unknown behavior.

## 0.11.12

### Patch Changes

- 02e1b6e: Add co-speaker support to presentation deliveries: a `coSpeakers` field (DIDs) on the delivery write schema, a hydrated `CoSpeaker` view-model on `ProfilePresentationDelivery`, and `fetchResolveActor` to resolve any atproto handle (or DID) to a profile card for the co-speaker picker.

## 0.11.11

### Patch Changes

- 8f1ddd4: Add `resolveCardHealth`, which returns both the card's clickable URL and a health-check `strategy` (`record` | `url` | `none`). First-party permalinks that render the record itself (Bluesky posts, tangled repos, smokesignal/atmo events, whitewind, frontpage, leaflet, spark, anisota, grain, pastesphere, kich/recipe.exchange) report `record`, so the sifa-api link-health scanner can verify them by record existence on the PDS instead of an HTTP probe of the rendering app — which false-positives permalinks whose app answers HEAD with 404/405. Foreign/derived targets (bookmarks, external publishers, other records' pages, profile pages) report `url`. `resolveCardUrl` is unchanged and now delegates to `resolveCardHealth(item).url`.

## 0.11.10

### Patch Changes

- 5f66b6d: Add recipe.exchange (`exchange.recipe.recipe`) to the app category map and URL patterns. Recipes link to the recipe.exchange viewer by rkey; the profile fallback points at the per-handle author page.

## 0.11.9

### Patch Changes

- 923e811: Add Kich (recipes), Margin notes, and Aether Docs (slide decks) to the app taxonomy and URL patterns.

  - New `Recipes` and `Slides` app categories.
  - `kich` → `Recipes` with a per-recipe URL pattern (`kich.io/recipes/{rkey}`); the card links to the Kich recipe page rather than the imported source in `record.url`.
  - `aetherdocs` → `Slides`, falling back to the author's Aether OS space (no public per-record viewer).
  - `resolveCardUrl` now resolves `at.margin.note` to its annotated source (`target.source`), matching the existing `at.margin.annotation` behaviour.

## 0.11.8

### Patch Changes

- 6beb582: Add 15 apps to the category map and collection-to-app routing (mcp, userinput,
  minomobi, voxport, badges, atvouch, watsm, plonk, alternativeproto, papili, vit,
  lifepo, streamthought, waow, lichen) so their collections render as named pills
  with category icons instead of raw NSIDs.

## 0.11.7

### Patch Changes

- faba377: Add ATCR (io.atcr) to the app category map and URL patterns. Published
  container repositories (io.atcr.repo.page) resolve to https://atcr.io/r/{handle}/{rkey}.

## 0.11.6

### Patch Changes

- f409a06: Add `summarizePresentationDeliveries`: rolls a talk's delivery history into a compact summary (times given, most recent year, keynote count, recent distinct venue sample), excluding cancelled occasions. Powers the collapsed Talks & sessions view on the profile.

## 0.11.5

### Patch Changes

- ee93ad2: Export `formatPresentationDuration` from the package root (it was built but missing from the barrel), and add CSV import parsers for the Talks & sessions feature: `parsePresentationDuration`, `durationFromMinutes`, `parseIntendedAudiences`, `stripHtmlToText`, `normalizePresentationRole`, `normalizePresentationMode`, and the row mappers `presentationCsvRowToRecord` / `presentationDeliveryCsvRowToRecord`.

## 0.11.4

### Patch Changes

- 4dbd5e9: Add `ProfilePresentation`, `ProfilePresentationDelivery`, and `PresentationLinkView` view-model types, and the `presentations` / `presentationDeliveries` fields on `Profile`, for the Talks & sessions profile section.

## 0.11.3

### Patch Changes

- 7d66262: Add `id.sifa.profile.presentation` and `id.sifa.profile.presentationDelivery` record schemas (the Talks & sessions content and occasion records), the `externalRecordRef` shared schema, presentation role / link-type / calendar-event taxonomy label maps, and a `formatPresentationDuration` helper.

## 0.11.2

### Patch Changes

- 8c03155: Add optional `credential` (at-uri) to `ProfileCourseRecordSchema` and `credentialRkey` to the `ProfileCourse` view type, so a course can reference the certification it earned. Mirrors `id.sifa.profile.course` lexicon 0.7.1.

## 0.11.1

### Patch Changes

- bb4a4e2: resolveCardUrl: link Tangled repos to their exact page when the record has no `name` field. Newer Tangled repos store the slug as the record rkey and omit `name`; for `sh.tangled.repo` the rkey is now used as the slug fallback, so the card links to `tangled.sh/{handle}/{slug}` instead of the profile page.

## 0.11.0

### Minor Changes

- e898b85: feat(query): surface scope-upgrade signal from `castRoadmapVote`

  Roadmap votes are now backed by `app.userinput.upvote` records written to the
  voter's PDS. `castRoadmapVote` (and `useCastRoadmapVote`) now return a
  discriminated-union result — `{ ok: true; data } | { ok: false; error }` —
  mirroring `createReaction`, so a first-time voter whose grant lacks the
  `app.userinput.upvote` collection surfaces as `scope_insufficient` with a
  `requiredScope`, letting the caller trigger an OAuth scope upgrade instead of
  showing an error. New exported types: `RoadmapVoteResult`, `RoadmapVoteError`, `CastRoadmapVoteResult`.

  Note: this changes the `castRoadmapVote` / `useCastRoadmapVote` return shape —
  check `result.ok` instead of `result.success`. `retractRoadmapVote` is
  unchanged. Pre-1.0, a breaking change ships as a `minor` bump (0.x has no
  major-for-breaking), which is why this is `minor` and not `major`.

## 0.10.18

### Patch Changes

- 7ebf296: Add `normalizePlatformId` to map lexicon platform tokens (`id.sifa.defs#platformLinkedin`) to short codes (`linkedin`); `getPlatformLabel` now normalizes first so token-form external accounts render the correct label.

## 0.10.17

### Patch Changes

- 62b0880: Add `revealMarqueDomain` / `unrevealMarqueDomain` fetchers and the `useRevealMarqueDomain` / `useUnrevealMarqueDomain` mutation hooks to the query layer, so sifa-web can toggle the public visibility of Marque-registered domains in the profile Links section.

## 0.10.16

### Patch Changes

- b61be95: Add `'marque'` to the `ExternalAccount.source` union so the profile Links section can surface domains registered through Marque (marque.at) as unverified, owner-controlled links.

## 0.10.15

### Patch Changes

- 843a547: Encode handle/DID path identifiers idempotently in the actor-scoped fetchers
  (`fetchProfile`, activity, follow, follow-extras, external-accounts,
  endorsement, discovery, stream, admin feature allowlists).

  A new `encodeIdentifier` helper decodes before encoding so an identifier that
  is already percent-encoded is not encoded twice. Next.js hands route params to
  RSC pages percent-encoded on a hard navigation (`did%3Aplc%3A...`) but decoded
  on client-side navigation, so the previous bare `encodeURIComponent` turned the
  former into `did%253Aplc%253A...`. The AppView then read that as a literal
  handle and returned 404, which broke DID-based profile links on direct visits
  while they worked when clicked within the app.

## 0.10.14

### Patch Changes

- 7667d52: Make `company` optional on `ProfilePositionRecordSchema` and add an `isCompanyRequired(employmentType)` predicate plus the `COMPANY_OPTIONAL_EMPLOYMENT_TYPES` set. Company is optional for the Independent employment-type group (contract, freelance, self-employed, independent work) and required otherwise — including when the type is unspecified. Mirrors sifa-lexicons making `company` optional on `id.sifa.profile.position`.

## 0.10.13

### Patch Changes

- 077add1: Add `Domains` app category (Globe icon) and map the `marque` app id to it, so Marque domain-registration activity is categorized instead of falling through as uncategorized.

## 0.10.12

### Patch Changes

- 3555783: Add `normalizeWorkplaceTypes` and `normalizeOpenTo` taxonomy helpers. Each resolves legacy tokens to their canonical value (`id.sifa.defs#remote` → `id.sifa.defs#remoteGlobal`, `id.sifa.defs#mentoring` → `id.sifa.defs#mentoringOthers`), dedups, and preserves first-seen order while passing unknown tokens through untouched. Lets editors map a legacy token onto a real option (migrating the record forward on save) and lets display collapse a record carrying both the legacy and canonical token into a single badge. Also exports `WORKPLACE_TYPE_LEGACY_ALIASES` and `OPEN_TO_LEGACY_VALUE_ALIASES`.

## 0.10.11

### Patch Changes

- 6cf5a29: Add atmo.rsvp (`quest.atmo.*`), Open Social (`community.opensocial.*`), and Kevara (`is.kevara.*`) to the app category map, URL patterns, and card-URL resolver. atmo.rsvp events link to `/p/{did}/e/{rkey}`; checkins resolve to their referenced event. Open Social memberships fall back to the app profile URL. Kevara is recognized (speaker-directory listings) but has no public web surface yet, so its cards render non-clickable.

## 0.10.10

### Patch Changes

- fccc1d2: Add Crate (`social.crate.*`) to the app taxonomy: category mapping (Articles), `social.crate.*` → `crate` collection resolution, and a `resolveCardUrl` rule that links `social.crate.content` cards to their `canonicalUrl` (notes render non-clickable, since Crate has no public per-record viewer).

## 0.10.9

### Patch Changes

- 96c3848: Re-export `OPEN_TO_TOKENS`, `OPEN_TO_TOKEN_TO_VALUE`, `OPEN_TO_VALUE_TO_TOKEN`, `openToTokenToValue`, `openToValueToToken`, and `OpenToGroup` from the root SDK barrel. Follow-up to 0.10.8 — these symbols landed in `./taxonomy` but the root barrel did not list them, so consumers importing from `@singi-labs/sifa-sdk` could not reach them.

## 0.10.8

### Patch Changes

- c32f409: Add `openTo` multi-value filter to `SearchFilters`, accepting short tokens (e.g. `"fullTime"`, `"mentor"`, `"collab"`) that the API expands server-side. Extend `OpenToOption` with `token` and `group` (`'work' | 'mentorship' | 'peer'`) so consumers can render grouped UI without duplicating the taxonomy. New helpers: `OPEN_TO_TOKENS`, `OPEN_TO_TOKEN_TO_VALUE`, `OPEN_TO_VALUE_TO_TOKEN`, `openToTokenToValue`, `openToValueToToken`. Adds optional `FilterOptions.openTo` facet shape for the matching `/api/search/filters` response.

## 0.10.7

### Patch Changes

- 90306d0: Add `Endorsements` app category (Phosphor icon `HandHeart`) and map the `atfund` app id to it. Enables sifa-api to register at.fund (`fund.at.graph.endorse`).

## 0.10.6

### Patch Changes

- d85dd05: Add Bluesky content-label preferences support. New fetchers
  `fetchBskyContentLabelPrefs` / `updateBskyContentLabelPrefs`, the
  `useBskyContentLabelPrefs` / `useUpdateBskyContentLabelPrefs` TanStack
  hooks, and the `shouldGateAdultMedia(labels, prefs, isAuthenticated)`
  helper that returns the final hide/show decision per post. Used by
  sifa-web to honor the viewer's existing Bluesky moderation settings on
  Sifa instead of always hiding adult media.

## 0.10.5

### Patch Changes

- 360ca29: Deep-link atstore reviews to the product page. `resolveCardUrl` now builds
  `https://atstore.fyi/products/{slug}` for `fyi.atstore.listing.review` items
  when `record.listingMeta.slug` is present (sifa-api enriches reviews by
  resolving the `subject` at-uri to the referenced `fyi.atstore.listing.detail`
  record). The previous `https://atstore.fyi/@{handle}` fallback resolved to a
  non-existent user profile page; it now falls back to the atstore.fyi root
  when no slug is available.

## 0.10.4

### Patch Changes

- 65e317c: Expose Bluesky content labels on activity items. Adds the optional
  `labels?: ActivityLabel[]` field to `ActivityItem`, the
  `ADULT_CONTENT_LABELS` constant (`porn`, `sexual`, `nudity`,
  `graphic-media`), and the `hasAdultContent(item)` predicate. Use these in
  clients to gate adult media without needing to know the Bluesky moderation
  label set yourself.

## 0.10.3

### Patch Changes

- dc48f06: Add publisher registry as the single source of truth for apps that publish through the shared `site.standard.*` namespace (Leaflet, Pckt, Offprint, WhiteWind, Unthread, Blento). Exposes `PUBLISHERS`, `Publisher`, `STANDARD_PUBLISHER_ID`, and helpers `getPublisherById`, `getPublisherByHost`, `getPublisherFromSiteUrl`. Additive only — no behaviour change for existing consumers.

## 0.10.2

### Patch Changes

- 5a9779d: Remove `picosky` from `APP_CATEGORY_MAP`. Picosky shows 0 records across all 1145 tracked Sifa users and `latest_record_at` is NULL — the app is effectively dead. The `Chat` category itself stays in `APP_CATEGORIES` so a future chat-style app can join cleanly.

## 0.10.1

### Patch Changes

- e5a6909: Fix `Pages` category icon: `BrowserSimple` doesn't exist in `@phosphor-icons/react`. Use `Browser` instead.

  Caught during the sifa-web rewrite (PR 2 of the category-taxonomy series).

## 0.10.0

### Minor Changes

- 0cad038: App-category taxonomy reconciliation with the live sifa-api registry.

  - Add **Music** category (`MusicNote` icon).
  - Rename `Questions` → `Q&A` to match sifa-api's existing category string.
  - Add the 4 apps Sifa onboarded in #137 (`spark`, `nooki`, `atstore`, `plyr`) to `APP_CATEGORY_MAP`.
  - Move `passports` from `Social` to `Places` — passports is a travel social network whose activity is fundamentally place-based.

  `APP_CATEGORY_MAP` now covers all 30 apps the API registry tracks plus the 4 web-only apps surfaced through sifa-web.

## 0.9.22

### Patch Changes

- 40a4326: Add app-category taxonomy and appId → category map.

  `APP_CATEGORIES` defines 17 internal categories (Articles, Chat, Code, Events, Links, Lists, Pages, Pastes, Photos, Places, Posts, Questions, Research, Reviews, Social, Verification, Video), each pinned to a Phosphor icon name. `APP_CATEGORY_MAP` assigns every tracked AT Protocol app to a category. `categoryForApp(appId)` resolves the category at runtime.

  This is the single source of truth that will replace the drifting maps currently scattered across `sifa-api`'s `atproto-app-registry.ts`, `sifa-web`'s `atproto-apps.ts`, and `sifa-web`'s `app-pill.tsx`. sifa-api migrates to consume this in a follow-up PR.

## 0.9.21

### Patch Changes

- ab284c7: Add per-app URL patterns + COLLECTION_TO_APP entries for Spark, Anisota, Nooki, atstore, and Plyr.fm — the apps onboarded during byarielm.fyi's Profile of the Day round. Spark and Anisota have rkey-based per-record URLs (verified live); Nooki, atstore, and Plyr.fm only ship profile fallbacks (SPA or slug-based routing).

## 0.9.20

### Patch Changes

- b0e71d8: Deprecate `FollowFeedItemSchema`, `SifaFeedItemSchema`, `AtmosphereFeedItemSchema`, `FollowFeedPageSchema`, `FetchFollowingFeedOptions`, `getFollowingFeed`, and `useFollowingFeed` (plus their inferred types). The `/api/following/feed` surface they consumed was reverted in sifa-api#674 after reconciliation against `decisions/activity-data-strategy.md` revealed the V5 feed conflicted with the live-PDS-read + Valkey-cache model and collapsed two distinct surfaces (Sifa Timeline + ATmosphere Stream) into one. Symbols remain exported to avoid a breaking change; scheduled for removal in the next major bump.
- 8d72625: Add SDK layer for the follow-graph follow-ups landing in `sifa-api#674`.

  Schemas: `FollowProfileSchema` + `FollowProfilePageSchema` (the
  `{ items, cursor }` page shape shared by mutuals + bluesky-suggestions),
  `FeatureAllowlistEntrySchema`, and the `FEATURE_FLAGS` const tuple.

  Fetchers (`/query/fetchers`): `getMutuals`, `getBlueskySuggestions`,
  `listFeatureAllowlist`, `addFeatureAllowlist`, `removeFeatureAllowlist`.

  Hooks (`/query/hooks`): `useMutuals` + `useBlueskySuggestions` (infinite
  queries), `useFeatureAllowlist` (read) + `useAddFeatureAllowlist` /
  `useRemoveFeatureAllowlist` (mutations with optimistic cache updates and
  rollback on failure).

  Query keys: `sifaQueryKeys.follow.mutuals(handle)`,
  `sifaQueryKeys.follow.blueskySuggestions()`,
  `sifaQueryKeys.admin.featureAllowlist(flag)`.

  Consumes the `sifa-api#674` contract; that API PR is still open at time of
  publish — SDK ships independently and `sifa-web` will swap to real endpoints
  once `api#674` lands.

- b12a498: Add follow + V5 feed query layer.

  Schemas: `makeGraphFollowRecordSchema(followerDid)` (self-follow refine),
  `note` field on `GraphFollowRecordSchema`, `FollowFeedItemSchema`
  (discriminated union of `SifaFeedItemSchema` + `AtmosphereFeedItemSchema`),
  `FollowFeedPageSchema`, plus `encodeFeedCursor` / `decodeFeedCursor`
  helpers for the composite `(indexedAt, source, id)` cursor.

  Fetchers (`/query/fetchers`): `followUser`, `unfollowUser`, `getFollowers`,
  `getFollowing`, `getFollowingFeed`. The legacy `fetchFollowing` stays for
  back-compat.

  Hooks (new `/query/hooks` subpath): `useFollow`, `useUnfollow` (mutations
  with cache-invalidation rollback), `useFollowers`, `useFollowingList`,
  `useFollowingFeed` (infinite queries).

  Consumes the sifa-api#673 endpoints; the API contract is locked there.

## 0.9.19

### Patch Changes

- 8616951: Add Leaflet (`pub.leaflet.*`) URL patterns and collection-to-app mapping. Per-document URL is `https://leaflet.pub/{rkey}`; profile fallback links to the marketing site since leaflet.pub has no per-user profile route. Consumed by sifa-web's upcoming leaflet activity card.

## 0.9.18

### Patch Changes

- f7c8812: Add optional `image` field to `ProfilePublication` for Standard.site article cover images (coverImage blob, with og:image fallback resolved server-side).

## 0.9.17

### Patch Changes

- ba1bddd: add @singi-labs/sifa-sdk/flags subpath with self-hosted twemoji country flags

  New optional subpath `@singi-labs/sifa-sdk/flags` exports `getFlagSvg(cc)` and
  `listSupportedCountryCodes()`. Ships 258 minified Twemoji regional-indicator
  SVGs (CC-BY 4.0, see `NOTICE`) so sifa-web's OG image renderer and the planned
  sifa-app can share flag assets without a CDN dependency at render time. Codes
  are ISO-3166 alpha-2 and lookups are case-insensitive. Refs the OG image spine
  redesign plan.

## 0.9.16

### Patch Changes

- e7d1066: Add optional `publicationUri`, `publicationUrl`, and `publicationName` to
  `ProfilePublication`. These carry the parent `site.standard.publication`
  reference for Standard.site articles so consumers can group a profile's
  articles by publication and render a per-publication subscribe affordance.
  Populated by sifa-api; undefined for Sifa/ORCID publications.

  Refs singi-labs/sifa-workspace#198.

## 0.9.15

### Patch Changes

- adeee0f: Fix `isVisibleActivityItem` for `app.beaconbits.beacon`: the lexicon field for a linked Bluesky post is `record.post` (a strongRef), not `record.postRef`. Beacons with a linked post but no shout were being hidden incorrectly. Caught while wiring the predicate into sifa-web's BeaconBitsCard.

## 0.9.14

### Patch Changes

- 8672b52: Add `isVisibleActivityItem(collection, record)` and the `ACTIVITY_VISIBILITY_RULES` registry. These let sifa-api and sifa-web share a single source of truth for "this record carries no card-worthy content" rules — e.g. BookHive shelf-adds without a review or stars, BeaconBits pins without a shout, Margin bookmarks without a source, Margin annotations without body text. Unknown collections default to visible, so the rule set is additive.

## 0.9.13

### Patch Changes

- b6be344: Add `@singi-labs/sifa-sdk/publishing` subpath: Zod schemas for the
  Standard.site lexicons (`publication`, `document`, `graph.subscription`,
  `graph.recommend`, `theme.basic`), the publisher allowlist (`leaflet.pub`,
  `pckt.blog`, `offprint.app`) with `matchPublisherByHost` / `matchPublisherByUri`
  helpers, and `StandardSiteEmbedView` types for rendering augmented
  activity items returned by sifa-api.

  Refs singi-labs/sifa-workspace#198, singi-labs/sifa-web#1095.

## 0.9.12

### Patch Changes

- a73382d: Add `linkHealth` field to `ActivityItem`. Carries the reachability state
  sifa-api enriches each `/api/activity` item with (`'ok' | 'broken' |
'unverifiable' | 'unknown'`). Also exports the new
  `ActivityItemLinkHealth` type. Additive and optional; legacy responses
  without the field continue to type-check.

  Replaces the local module augmentation sifa-web carried in
  sifa-web#1085.

## 0.9.11

### Patch Changes

- 5922b73: Generalize the hide-item surface so consumers can hide any profile section item, not just publications and Keytrace claims.
  - Adds `hidden?: boolean` to `ProfilePosition`, `ProfileEducation`, `ProfileCertification`, `ProfileProject`, `ProfileVolunteering`, `ProfileCourse`, `ProfileHonor`, `ProfileLanguage` (already on `ProfilePublication`, `ExternalAccount`).
  - Adds new generic fetchers and hooks targeting the unified `/api/profile/items/hide` and `/api/profile/items/bulk-hide` endpoints: `hideProfileItem`, `unhideProfileItem`, `bulkHideProfileItems`, `bulkUnhideProfileItems`, plus the corresponding `useHideProfileItem`, `useUnhideProfileItem`, `useBulkHideProfileItems`, `useBulkUnhideProfileItems`. All accept `{ itemType, source, itemId | itemIds }` where `itemType` covers every section with individual items and `source` distinguishes `pds`, `standard`, and `orcid` origins so future credential and endorsement sources extend without API churn.
  - Existing publication and Keytrace hide hooks are unchanged.

## 0.9.10

### Patch Changes

- ff43f37: Re-export `pickPrimaryPosition` (and its `PrimaryPositionCandidate` type) from the package's main entry. The helper landed in 0.9.8/0.9.9 but only via `./logic/index.js` — the explicit allowlist in `src/index.ts` didn't include it, so consumers couldn't import it from `@singi-labs/sifa-sdk`.

## 0.9.9

### Patch Changes

- 9de5272: Fix `Release` workflow: `npm publish` was running the package `prepare` script (which invokes `husky`) inside a lifecycle env where the pnpm-installed husky binary wasn't on PATH, breaking every publish. Pass `--ignore-scripts` to `npm publish` since the dist is already built by the workflow.

## 0.9.8

### Patch Changes

- 6c03494: Internal: harden CI release pipeline. All GitHub Actions pinned to commit SHAs, `--ignore-scripts` on every install, and the release workflow split into separate `build` and `publish` jobs so the OIDC-bearing publish job no longer installs project dependencies. No runtime or API changes.
- 543a493: Add `pickPrimaryPosition` helper that returns the user-flagged primary active position, falling back to the active position with the most recent `startedAt`. Use this in every surface that needs a single "current role" (profile hero, OG image, meta descriptions, JSON-LD) so they no longer diverge.

## 0.9.7

### Patch Changes

- 3ac2da8: Add URL patterns and collection-prefix mappings for two more atproto apps:

  - **ASQ** (`fyi.asq.*`): questions URL `https://asq.fyi/q/{did}/{rkey}`,
    profile fallback `https://asq.fyi`.
  - **Passports** (`social.passports.*`): profile fallback only,
    `https://passports.social/profile/{handle}`.

  Both apps already have cards in sifa-web. Without these entries in the SDK
  registry, `resolveCardUrl` returns `null` for them — which would cause the
  upcoming sifa-api scanner (singi-labs/sifa-workspace#196 PR 3) to silently
  skip 5-10% of activity-card URLs.

  Additive — no existing consumers change.

## 0.9.6

### Patch Changes

- 177cbfb: `resolveCardUrl` now absorbs two URL-correctness guards that previously lived only in
  sifa-web. Both prevent broken URLs that would 404 when users click activity cards (and
  when the upcoming sifa-api scanner HEAD-checks them):

  - **Bluesky collection guard** (sifa-web#1070 / sifa-web#1073): the per-item URL
    `https://bsky.app/profile/{handle}/post/{rkey}` is only valid for
    `app.bsky.feed.post`. Other `app.bsky.*` collections (`actor.status` with
    `rkey=self`, `graph.cancellation`, etc.) now fall back to the profile URL.
  - **Tangled repo-slug validation** (sifa-web#1071 / sifa-web#1072): multi-segment
    aggregate `record.name` values (whitespace, slashes, special chars) now fall back
    to the profile URL instead of producing 404 URLs like
    `https://tangled.sh/{handle}/atproto-snake%20azurite%20...`.

  These were just shipped in sifa-web as local fixes. Moving them into the SDK is a
  prerequisite for the sifa-web migration (singi-labs/sifa-workspace#196 PR 2) and the
  sifa-api scanner (PR 3) — all three call-sites need the same guards or broken-link
  detection drifts from what users actually click.

  No behaviour change for existing consumers — the guards only trim outputs that were
  already broken.

## 0.9.5

### Patch Changes

- 70ab0a7: Add `getActivityTier(nsid)` helper + activity-tier taxonomy types.

  Exposes the canonical `activity-tiers.json` taxonomy from `sifa-lexicons` as
  typed SDK helpers so consumers (sifa-web today, future sifa-app, third
  parties) can classify any AT Protocol NSID into one of three tiers
  (`creation`, `action`, `filtered`) without inlining the JSON.

  New exports: `getActivityTier`, `getLexiconEntry`, `getTierMeta`,
  `getActivityTaxonomyVersion`, `ACTIVITY_TIERS`, and the supporting types
  `ActivityTier`, `TierMeta`, `LexiconEntry`, `ActivityTaxonomy`.

  The taxonomy JSON is bundled into the build output (no runtime fetch) and
  defaults unknown NSIDs to `filtered` so consumers never leak unclassified
  records to public profile surfaces.

- 684f8a4: Add `resolveCardUrl(item)` and `getAppIdForCollection(collection)` helpers, plus the
  `APP_URL_PATTERNS` / `COLLECTION_TO_APP` registry, under a new `cards/` module.

  `resolveCardUrl` returns the canonical clickable URL for an activity item (the same URL
  the sifa-web activity cards render), or `null` when the item is not clickable. This is
  the single source of truth that both sifa-web (UI) and sifa-api (the upcoming external
  URL health scanner, singi-labs/sifa-workspace#196) will use, so broken-link detection
  lines up with what users actually click.

  The helper handles the per-collection bespoke URL patterns currently inlined in the card
  components: tangled per-repo URLs, kipclip bookmark targets, margin source URLs,
  smokesignal RSVP/event uri parsing, standard-document siteUrl+path, and generic
  `record.url` fallback, with pattern-based per-item/profile URLs as the final fallback.

  No behaviour change for existing consumers — this is additive. sifa-web will migrate to
  the helper in a follow-up.

## 0.9.4

### Patch Changes

- 62e0af2: Add `codeberg`, `gitlab`, `forgejo`, and `gitea` to the platform taxonomy so users can link non-GitHub forge accounts as labeled external accounts.
- 89316a6: Add `limitCombiningMarks` and `sanitizeDisplayText` utilities under `format/`.
  Caps stacked Unicode combining marks (Zalgo defence) and strips bidi
  formatting controls (LRM/RLM/etc.) from untrusted PDS record text before
  rendering, preventing vertical-overflow attacks where a single record can
  visually bleed over neighbouring UI.

## 0.9.3

### Patch Changes

- e22aebc: Add optional `givenName` and `familyName` to `ProfileSelfRecordSchema` and the
  `Profile` interface, matching the additive `id.sifa.profile.self` lexicon
  change in `sifa-lexicons@0.6.2`. Adds a `formatStructuredName(givenName,
familyName)` helper that returns `${given} ${family}` (Schema.org Person
  order), one of the two if only one is present, or `undefined` so callers can
  fall back to `displayName`.

## 0.9.2

### Patch Changes

- 8d1b8b5: Extend `fontFallbackStacks.sans` and `fontFallbackStacks.display` with international script fallbacks (Noto Sans, Noto Sans Arabic/Devanagari/Thai/Hebrew) and OS-installed CJK fonts (Hiragino, Yu Gothic, PingFang SC/TC, Microsoft YaHei/JhengHei, Apple SD Gothic Neo, Malgun Gothic, Noto Sans CJK). Mirrors the chain shipped in sifa-web#1011. The brand font and generic terminator stay in the same positions; consumers depending on the existing stacks see additive entries only.

## 0.9.1

### Patch Changes

- 8cb613e: Add `OPEN_TO_OPTIONS` and `getOpenToLabelKey` covering all 8 `id.sifa.defs#openToWorkStatus` lexicon `knownValue`s, including the `commissions` token introduced in sifa-lexicons #41. Mirrors the `INDUSTRY_OPTIONS` `{ value, labelKey }` shape so consumers can run the `labelKey` through their own i18n layer. Resolves the legacy `id.sifa.defs#mentoring` alias to `mentoringOthers` for backward compatibility with records written before the lexicon migration. Lexicon-anchored tests catch future drift.

## 0.9.0

### Minor Changes

- 295a018: Extend `NetworkMapGenerationJob` with optional `position` and `etaSeconds` fields, surfaced by the backend queue + ETA system landing in singi-labs/sifa-api#529.

  - `position?: number` — queue rank when the job is still pending and hasn't been picked up by the worker (0 = next to run).
  - `etaSeconds?: number` — estimated remaining time, derived from the median historical duration for the user's follow-count bucket.

  Both are optional, so consumers built against the previous shape keep working unchanged. Frontends that want to render queue position or ETA can opt in by reading the new fields.

## 0.8.1

### Patch Changes

- a43aeab: Add `EMPLOYMENT_TYPE_LABELS` / `EMPLOYMENT_TYPE_GROUPS` / `getEmploymentTypeLabel` and `WORKPLACE_TYPE_LABELS` / `WORKPLACE_TYPE_OPTIONS` / `getWorkplaceTypeLabel` taxonomies covering every `id.sifa.defs#employmentType` and `id.sifa.defs#workplaceType` lexicon `knownValue`. Tests anchor the taxonomies against the lexicon to catch future drift.

## 0.8.0

### Minor Changes

- 1f026b9: Add `network-map` query fetchers for the personal-network visualization feature (SIF-73).

  Exports `initiateNetworkMapGeneration`, `checkNetworkMapJobStatus`, `fetchNetworkMap`, the `isNetworkMapResponse` discriminator, and the supporting types (`NetworkMapNode`, `NetworkMapEdge`, `NetworkMapGraphData`, `NetworkMapResponse`, `NetworkMapGenerationJob`, `NetworkMapPendingJob`). Targets the matching API endpoints in `sifa-api` (singi-labs/sifa-api#527).

## 0.7.10

### Patch Changes

- 7fc646a: Internal: release workflow now authenticates the changesets action with a fine-grained PAT (`CHANGESETS_TOKEN`) instead of the default `GITHUB_TOKEN`. This is purely infrastructure: bot-authored "Version Packages" PRs can now trigger the required `check` CI without needing a manual close/reopen. No public API change.

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
