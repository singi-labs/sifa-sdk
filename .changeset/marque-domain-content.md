---
'@singi-labs/sifa-sdk': patch
---

Surface a domain registration's content on the two-tier line. Adds a `registered` verb (mapped to `at.marque.domain`) and reads a record's `domain` field in the generic text extractor, so a Marque line reads "Registered {domain}" instead of the meaningless "Shared: active".
