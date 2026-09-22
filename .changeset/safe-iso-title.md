---
"@singi-labs/sifa-sdk": patch
---

Add `formatIsoTitle(dateString)` — returns a canonical ISO-8601 instant for a valid date and `''` for an invalid one, for `<time title>` tooltips. Guards against `new Date(x).toISOString()` throwing `RangeError: Invalid time value` on a bad timestamp.
