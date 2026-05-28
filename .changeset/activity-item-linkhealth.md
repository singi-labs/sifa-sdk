---
'@singi-labs/sifa-sdk': patch
---

Add `linkHealth` field to `ActivityItem`. Carries the reachability state
sifa-api enriches each `/api/activity` item with (`'ok' | 'broken' |
'unverifiable' | 'unknown'`). Also exports the new
`ActivityItemLinkHealth` type. Additive and optional; legacy responses
without the field continue to type-check.

Replaces the local module augmentation sifa-web carried in
sifa-web#1085.
