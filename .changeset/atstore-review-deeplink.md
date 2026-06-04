---
'@singi-labs/sifa-sdk': patch
---

Deep-link atstore reviews to the product page. `resolveCardUrl` now builds
`https://atstore.fyi/products/{slug}` for `fyi.atstore.listing.review` items
when `record.listingMeta.slug` is present (sifa-api enriches reviews by
resolving the `subject` at-uri to the referenced `fyi.atstore.listing.detail`
record). The previous `https://atstore.fyi/@{handle}` fallback resolved to a
non-existent user profile page; it now falls back to the atstore.fyi root
when no slug is available.
