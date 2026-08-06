---
'@singi-labs/sifa-sdk': patch
---

Add `onBehalfOf`, `onBehalfOfDid` and `onBehalfOfEntityRef` to the `ProfilePosition` type. The fields were added to `PositionView` and the schemas in an earlier release, but `ProfilePosition` is the type profile UIs actually render, so consumers could not read the disclosure.
