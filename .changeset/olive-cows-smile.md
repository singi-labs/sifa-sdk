---
'@singi-labs/sifa-sdk': patch
---

Add `fetchReciprocityCandidate` and `useReciprocityCandidate`: someone the
signed-in user follows on Sifa whose skills they could endorse. The AppView
does the picking (dismissals, blocks, has-a-skill, twelve-hour rotation), so
this is a plain read. Returns `null` both when nobody is left to suggest and on
failure, so a broken suggestion cannot break the page hosting it.
