---
'@singi-labs/sifa-sdk': patch
---

Add the `@singi-labs/sifa-sdk/atproto` subpath: dependency-free write helpers
(`likeRecord`, `unlikeRecord`, `repostRecord`, `unrepostRecord`) that take a
consumer-provided authenticated agent and write records directly to the user's
PDS. This is the shared write service layer for native-direct interactions; reads
stay on the sifa-api HTTP client. The agent is described structurally, so the
subpath adds no `@atproto/api` dependency.
