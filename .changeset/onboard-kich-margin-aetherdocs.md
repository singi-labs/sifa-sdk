---
'@singi-labs/sifa-sdk': patch
---

Add Kich (recipes), Margin notes, and Aether Docs (slide decks) to the app taxonomy and URL patterns.

- New `Recipes` and `Slides` app categories.
- `kich` → `Recipes` with a per-recipe URL pattern (`kich.io/recipes/{rkey}`); the card links to the Kich recipe page rather than the imported source in `record.url`.
- `aetherdocs` → `Slides`, falling back to the author's Aether OS space (no public per-record viewer).
- `resolveCardUrl` now resolves `at.margin.note` to its annotated source (`target.source`), matching the existing `at.margin.annotation` behaviour.
