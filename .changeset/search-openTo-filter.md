---
'@singi-labs/sifa-sdk': patch
---

Add `openTo` multi-value filter to `SearchFilters`, accepting short tokens (e.g. `"fullTime"`, `"mentor"`, `"collab"`) that the API expands server-side. Extend `OpenToOption` with `token` and `group` (`'work' | 'mentorship' | 'peer'`) so consumers can render grouped UI without duplicating the taxonomy. New helpers: `OPEN_TO_TOKENS`, `OPEN_TO_TOKEN_TO_VALUE`, `OPEN_TO_VALUE_TO_TOKEN`, `openToTokenToValue`, `openToValueToToken`. Adds optional `FilterOptions.openTo` facet shape for the matching `/api/search/filters` response.
