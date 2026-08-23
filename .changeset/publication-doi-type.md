---
'@singi-labs/sifa-sdk': patch
---

Accept `doi` and `type` on `PublicationWriteSchema`, matching the fields added to `id.sifa.profile.publication`. A DOI is normalized to its bare form on write, so a pasted `https://doi.org/...` and a `doi:` citation prefix both land as the identifier rather than three spellings of it. Adds the `PUBLICATION_TYPE_OPTIONS` taxonomy (ORCID's work-type vocabulary) and `normalizeDoi`, which now backs the JSON-LD publication builder as well.
