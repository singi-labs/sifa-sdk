---
'@singi-labs/sifa-sdk': patch
---

Classify `pics.pixl.image` as a `creation`-tier record (app `pixl`) in the activity taxonomy. Without this the Pixl scan collection defaulted to `filtered`, which fails the registry/taxonomy reconciliation check in sifa-api. Follow-up to the initial Pixl onboarding.
