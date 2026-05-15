---
'@singi-labs/sifa-sdk': patch
---

Add quoted-post batch resolution to `@singi-labs/sifa-sdk/query`:

- **`resolveQuotedPosts(config, uris, options?)`** — batches AT-URIs into chunks of `QUOTED_POSTS_BATCH_MAX` (20) and fires them in parallel against `POST /api/quoted-posts/resolve`. Auto-deduplicates the input. Returns `Record<uri, QuotedPostResult>`; failed URIs are absent from the map. Supports `cookieHeader` for Next.js RSC server-side calls.
- **Result types**: `QuotedPostView` (resolved snapshot — author, text, createdAt, optional images), `QuotedPostResult` (`'ok' | 'deleted' | 'unavailable'`), `QuotedPostAuthor`, `QuotedPostImage`, `ResolveQuotedPostsOptions`.
- **`ActivityItem`** gains two optional fields: `quotedPost` (inlined when the server already resolved via the Bluesky AppView) and `quotedPostUri` (when the client needs to lazy-batch via this fetcher).

These mirror the response contract added in `sifa-api` (issue singi-labs/sifa-workspace#178). Pairs with the consumer changes in `sifa-web`.
