---
"@singi-labs/sifa-sdk": patch
---

Add `fetchTypeaheadActors` (in `@singi-labs/sifa-sdk/query`) for actor autocomplete. It typeaheads indexed Sifa profiles by partial name or handle against `/api/actor/typeahead`, returning `ActorCard[]`. Prefer it over `fetchSearchProfiles` for name/handle comboboxes: the search endpoint uses full-text matching, which misses handle prefixes and partial names.
