# @singi-labs/sifa-sdk

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
