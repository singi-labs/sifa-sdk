---
'@singi-labs/sifa-sdk': patch
---

`TERM_MAPPINGS` is now derived from sifa-lexicons rather than maintained here.

The same facts were hand-written in two repos: as `x-skos:*` annotations on the lexicons, and as a literal table in this package. Nothing checked that they agreed.

The lexicons win, because their annotations are published to the authority PDS and are what a third party resolving `id.sifa.*` actually reads. `src/jsonld/term-mappings.json` is now a committed copy of the lexicons' generated document, refreshed by `pnpm sync:term-mappings` and drift-checked nightly against a fresh checkout of sifa-lexicons.

No API change: `TERM_MAPPINGS`, `VOCABULARIES`, `expandCurie`, `mappingsForLexicon` and `isDeliberatelyUnmapped` all behave as before, and the existing tests pass untouched.
