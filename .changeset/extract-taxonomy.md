---
'@singi-labs/sifa-sdk': minor
---

Extract domain taxonomies from `sifa-web` into the SDK:

- `CONTINENTS` + `getContinent(countryCode)` and `ContinentCode` union
- `COUNTRIES` (ISO 3166-1 fallback list)
- `INDUSTRY_OPTIONS` two-level taxonomy and `IndustryOption` type
- `SKILL_CATEGORIES`, `SkillCategory`, `CATEGORY_ORDER`, `CATEGORY_LABELS` -- consolidated from two separate sources in `sifa-web`
- `dedupeSkills` and `groupSkillsByCategory` plus `MergedProfileSkill` type
- Platform data layer: `PLATFORM_LABELS`, `PLATFORM_OPTIONS`, `PlatformId`, `isKnownPlatform`, `getPlatformLabel`, `getFaviconUrl`

Platform icon mapping stays platform-specific and remains in `sifa-web` (and will go into `sifa-app` separately) -- the SDK exposes the data, consumers map identifiers to their own icon components.
