---
'@singi-labs/sifa-sdk': patch
---

Add an optional `sourceUrl` to `StreamCardVM` so consumers can link each activity card to the record on its source app. `toStreamCardVM` computes it via the shared `resolveCardUrl`, keeping the transform pure; the field is absent when no linkable http(s) URL is available. The input `ActivityItem` gains an optional `authorHandle` the AppView injects (the snapshot is per-author) so handle-keyed apps (Bluesky, Popfeed, Tangled, ...) resolve their `sourceUrl`.
