---
'@singi-labs/sifa-sdk': patch
---

Add the `onBehalfOf` representation disclosure to the position schemas and `PositionView`: `onBehalfOf`, `onBehalfOfDid`, `onBehalfOfEntityRef`, plus the view-only resolved `onBehalfOfEntityName`. Mirrors sifa-lexicons#88 and #90. Used for board seats held as a fund's representative, where the person answers to a third party.
