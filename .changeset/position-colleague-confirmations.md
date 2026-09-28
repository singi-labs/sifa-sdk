---
'@singi-labs/sifa-sdk': patch
---

Add the `id.sifa.defs#colleague` confirmation relation, and type colleague confirmations on `ProfilePosition` (`confirmations` with the confirmers, and `viewerConfirmation` for the signed-in viewer). Add `fetchViewerPositionConfirmations`, which reads the signed-in viewer's confirm state for each of someone's positions.
