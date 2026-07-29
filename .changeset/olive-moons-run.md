---
'@singi-labs/sifa-sdk': patch
---

Carry the skill record CID, and make it optional when endorsing.

`ProfileSkill` gains an optional `cid`, and `EndorsementInput.skillCid` is now
optional. Only the firehose carries a CID, so a skill added moments ago has
none indexed; the AppView resolves it from the owner's PDS when omitted.
