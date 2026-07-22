---
'@singi-labs/sifa-sdk': patch
---

Add three optional fields to the org profile schemas and view type: `addresses` (array of `community.lexicon.location.address` shapes, max 10), `companySize` (open string range, declared not calculated), and `links` (array of `name`/`url` items, max 10). Mirrors the additive `id.sifa.org.profile` lexicon change for the org page data model.
