---
'@singi-labs/sifa-sdk': patch
---

Add `@singi-labs/sifa-sdk/publishing` subpath: Zod schemas for the
Standard.site lexicons (`publication`, `document`, `graph.subscription`,
`graph.recommend`, `theme.basic`), the publisher allowlist (`leaflet.pub`,
`pckt.blog`, `offprint.app`) with `matchPublisherByHost` / `matchPublisherByUri`
helpers, and `StandardSiteEmbedView` types for rendering augmented
activity items returned by sifa-api.

Refs singi-labs/sifa-workspace#198, singi-labs/sifa-web#1095.
