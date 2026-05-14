---
'@singi-labs/sifa-sdk': minor
---

Add `LocationValue.locality` and `ProfileLocation.locationLocality` to mirror the `community.lexicon.location.address` field names. Both are optional and additive -- existing consumers that use `city` / `locationCity` continue to work during the sifa-api alias window (see singi-labs/sifa-api#440 / #441).
