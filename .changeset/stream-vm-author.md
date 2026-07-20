---
'@singi-labs/sifa-sdk': patch
---

Add an optional `author` identity (`did`/`handle`/`displayName`/`avatar`) to `StreamCardVM`, populated by `toStreamCardVM` from new `ActivityItem.authorDisplayName`/`authorAvatar` inputs (plus the existing `authorHandle` and the DID parsed from the record uri). Nested subject cards (quoted / reposted / replied-to posts) now carry the original author's identity so renderers can show whose post it is. Exposes `StreamAuthor` and `streamAuthorSchema`.
