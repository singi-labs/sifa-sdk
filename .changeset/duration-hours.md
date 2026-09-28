---
'@singi-labs/sifa-sdk': patch
---

`parsePresentationDuration` now converts hours to minutes ("3 hours" is 180, "40 minutes - 4 hours" is 40 to 240). Before, the unit was ignored, so "3 hours" read as 3 minutes.
