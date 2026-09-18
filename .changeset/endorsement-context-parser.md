---
'@singi-labs/sifa-sdk': patch
---

Add `parseEndorsementComment` and `formatRelationship` (from `/format`): split a stored endorsement comment's `[relationship: detail]` prefix into a friendly relationship label and the endorser's note, so clients never render a raw `[co_authored]` token. Ports the existing web logic into the SDK so web and app share one implementation.
