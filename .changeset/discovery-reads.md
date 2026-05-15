---
'@singi-labs/sifa-sdk': minor
---

Add discovery and search read endpoints to `@singi-labs/sifa-sdk/query`:

- **Search:** `fetchSearchProfiles` / `useSearchProfiles`, `fetchSkillSuggestions` / `useSkillSuggestions`, `fetchSearchFilters` / `useSearchFilters`
- **Discovery:** `fetchSimilarProfiles` / `useSimilarProfiles`, `fetchSuggestions` / `useSuggestions`, `fetchSuggestionCount` / `useSuggestionCount`, `fetchFeaturedProfile` / `useFeaturedProfile`
- **Follow:** `fetchFollowing` / `useFollowing`

Plus the supporting result types (`ProfileSearchResult`, `SearchFilters`, `SearchResponse`, `SkillSearchResult`, `FilterOptions`, `SimilarProfile`, `SuggestionProfile`, `SuggestionsResponse`, `FeaturedProfile`, `FollowProfile`, `FollowingResponse`) and query-key entries (`sifaQueryKeys.search.*`, `sifaQueryKeys.discovery.*`, `sifaQueryKeys.follow.*`).

These mirror the read endpoints currently in `sifa-web/src/lib/api.ts`. Behavior preserved including the "no input, no fetch" shortcut on search and skill suggestions, the `cookieHeader` forwarding pattern for Next.js RSC server-side calls, and the safe-default error behavior (empty arrays / null / 0).

Part of the Phase 5 sifa-app readiness work. Remaining read endpoints (activity, stats, reactions, roadmap, settings) follow in a subsequent release; mutations land separately.
