---
'@singi-labs/sifa-sdk': patch
---

Add the optional `entityRef` field to `ProfilePositionRecordSchema` and the `ProfilePosition` type (#159) — the portable Wikidata/ROR/LEI URI written when a user picks an organization from the resolver typeahead, constrained to http(s). Lets sifa-web read and write the field type-safely through the existing position fetchers.
