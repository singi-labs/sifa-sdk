---
'@singi-labs/sifa-sdk': patch
---

Search: `SearchResponse` gains optional `suggestions` (zero-result "did you mean" matches, typed as `ProfileSearchSuggestion`), `ProfileSearchResult` gains optional `openTo`, and `fetchSearchProfiles` accepts `skill` and `country` as a string or an array, sent as repeated query params.
