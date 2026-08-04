---
'@singi-labs/sifa-sdk': patch
---

Add `locationSegments`, which splits a profile location into the ordered
segments shown on a profile and marks which link to a search. Drops a segment
that repeats its neighbour ("Oslo, Oslo, Norway" reads "Oslo, Norway") and
drops blank segments with their separator. Only the country links today;
locality and region render as plain text until search filters exist for them.
