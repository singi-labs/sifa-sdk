---
'@singi-labs/sifa-sdk': patch
---

Add `isSelfAuthoredRich` / `renderAsLine`: the two-tier timeline policy over `StreamCardVM`. A view model renders as a rich card only when it is the actor's own creation (`tier === 'creation'`) and carries rich body or media; everything else (relational actions, thin text posts) renders as a compact line.
