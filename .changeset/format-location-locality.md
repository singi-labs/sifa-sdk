---
'@singi-labs/sifa-sdk': patch
---

`formatLocation` now prefers the new `locality` field (community.lexicon.location.address) over the legacy `city` slot, with a fallback to `city` so values produced before the sifa-api alias migration still render correctly during the additive transition window. No breaking change -- the fallback preserves existing behavior for callers that only set `city`.
