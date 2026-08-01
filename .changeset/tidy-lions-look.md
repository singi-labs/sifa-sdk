---
'@singi-labs/sifa-sdk': patch
---

Add `endorsedAs` to `ProfileSkill`: names a skill was endorsed under where they
differ from its current name. A rename keeps the same record, so endorsements
follow it and stay counted; surfacing the original name is what stops a rename
quietly laundering an endorsement.
