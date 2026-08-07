---
'@singi-labs/sifa-sdk': patch
---

Export `isOnBehalfOfApplicable` and `ON_BEHALF_OF_EMPLOYMENT_TYPES` from the package entry point. They shipped in 0.12.66 but were missing from both the taxonomy barrel and the root index, so consumers could not import them.
