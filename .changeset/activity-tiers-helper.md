---
'@singi-labs/sifa-sdk': patch
---

Add `getActivityTier(nsid)` helper + activity-tier taxonomy types.

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
