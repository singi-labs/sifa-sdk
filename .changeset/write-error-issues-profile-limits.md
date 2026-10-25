---
'@singi-labs/sifa-sdk': patch
---

Failed writes now carry field-level validation `issues` from a sifa-api 400 `ValidationError` body (`WriteFailure.issues`, typed `WriteIssue[]` with `path`, `message` and optional `code`; malformed entries are dropped; `WriteFailure` and `WriteIssue` are exported from `/query`). Export `PROFILE_TEXT_LIMITS` (grapheme and UTF-8 byte limits for the `id.sifa.profile.self` text fields, the single source for the field schemas), the field schemas `profileDisplayNameSchema`, `profileNameSchema`, `profilePronounsSchema`, `profileHeadlineSchema` and `profileAboutSchema`, and `lexiconString` from `/schemas` and the root entry.
