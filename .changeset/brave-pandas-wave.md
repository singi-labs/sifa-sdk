---
'@singi-labs/sifa-sdk': patch
---

Support endorsing a skill the subject has not listed.

`skill` is optional on the endorsement record and `skillUri` optional on
`createEndorsement`: omitting it proposes a skill named by `skillName`. The
confirmation record gains an optional `skill` ref to the record it became, and
`confirmEndorsement` returns `skillUri` and `skillCreated`. `PendingEndorsement`
gains `proposesNewSkill`, since accepting one adds a skill to the profile as
well as publishing the endorsement.
