---
'@singi-labs/sifa-sdk': patch
---

Drop the `id.sifa.auth*` permission sets from `SIFA_REPO_GROUPS` and flag fallback labels. The auth lexicons are `permission-set` definitions, never written as records, so the group holding them promised a consent-management surface that could only ever come back empty; `consents-access` becomes `meetings` and `connections` becomes `people`. `RepoRecordLabel.isFallback` marks a label that is the collection leaf rather than the user's own data, so a surface can substitute its own wording instead of rendering a row that reads "follow".
