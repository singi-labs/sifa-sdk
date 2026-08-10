---
'@singi-labs/sifa-sdk': patch
---

Accept `authors` on `PublicationWriteSchema`. The field was absent, so the generic-record write endpoint stripped every co-author before the record reached the PDS. The lexicon field, the indexer, the claim flattening and the editor all existed; nothing joined them, and an object schema drops unknown keys without complaint, so saving reported success and wrote nothing.
