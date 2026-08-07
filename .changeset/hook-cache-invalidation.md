---
'@singi-labs/sifa-sdk': patch
---

Fix cache invalidation in every mutation hook. `...options` was spread after the hook's own `onSuccess`/`onError`, so a consumer passing either callback replaced the internal handler and silently lost `invalidateQueries` — stale UI after a successful write, with no error anywhere. 52 mutation blocks across 22 files, plus a guard test that fails if the ordering is reintroduced.
