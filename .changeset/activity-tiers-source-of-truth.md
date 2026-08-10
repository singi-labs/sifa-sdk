---
'@singi-labs/sifa-sdk': patch
---

This package is now the source of truth for the activity taxonomy, and `scripts/sync-activity-tiers.mjs` is removed.

The script pulled `src/taxonomy/activity-tiers.json` from sifa-lexicons, but the two had drifted 60 entries apart: every substantive taxonomy change landed here, none upstream. Running the sync would have deleted real work.

The taxonomy is editorial rather than protocol. None of it is published to a PDS, and it governs how Sifa renders records rather than what any record means, so it belongs with the rendering code that acts on it. It is now served at `https://sifa.id/.well-known/sifa-activity-tiers.json`.

No API change: `ACTIVITY_TIERS`, `getActivityTier`, `getLexiconEntry`, `getTierMeta` and `getActivityTaxonomyVersion` are untouched.
