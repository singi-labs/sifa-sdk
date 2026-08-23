---
'@singi-labs/sifa-sdk': patch
---

Export `PUBLICATION_TYPE_OPTIONS`, `PUBLICATION_TYPE_LABELS`, `getPublicationTypeLabel`, `PublicationTypeOption`, and `normalizeDoi` from the package root. They shipped in the previous release but only inside the module tree, and the SDK has no `./taxonomy` or `./format` subpath, so no consumer could reach them.
