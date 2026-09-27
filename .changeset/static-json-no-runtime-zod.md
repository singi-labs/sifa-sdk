---
'@singi-labs/sifa-sdk': patch
---

`ACTIVITY_TIERS` and `ACTIVITY_VERBS` no longer validate their bundled JSON with zod at load time. The tests now check the JSON shape instead. `streamVerbSchema` moved to its own module and is still exported from the same entry points. Code that only reads the taxonomy or maps collections to verbs no longer loads zod.
