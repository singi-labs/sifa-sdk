---
'@singi-labs/sifa-sdk': patch
---

Add optional `publicationUri`, `publicationUrl`, and `publicationName` to
`ProfilePublication`. These carry the parent `site.standard.publication`
reference for Standard.site articles so consumers can group a profile's
articles by publication and render a per-publication subscribe affordance.
Populated by sifa-api; undefined for Sifa/ORCID publications.

Refs singi-labs/sifa-workspace#198.
