---
"@singi-labs/sifa-sdk": patch
---

Add `countRecentActivity(days, windowDays, now?)` — a pure predicate that sums per-day activity totals within the last `windowDays` calendar days. Structurally accepts the query layer's `HeatmapDay[]`. Consumers use it to gate the profile Activity block: hide the block for visitors when a profile has too little recent activity, while owners always see it.
