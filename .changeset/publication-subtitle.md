---
'@singi-labs/sifa-sdk': patch
---

Add an optional `subtitle` to the publication record schema (`ProfilePublicationRecordSchema`) and the `ProfilePublication` response type. Sources such as Crossref and ORCID store a publication's subtitle separately from its main title; carrying it lets multi-part paper series (which share one title) render as distinct entries.
