---
'@singi-labs/sifa-sdk': patch
---

Add `isLinkblogShareDocument` / `isLinkblogPublication` predicates (and the `SKYREADER_LINKBLOG_MARKER_URL` constant) on the `/publishing` subpath. They identify `site.standard.document` records that are shared external articles from a linkblog (e.g. Skyreader) rather than the user's own writing, so consumers can exclude them from activity and portfolio surfaces while leaving authored Standard.site posts untouched.
