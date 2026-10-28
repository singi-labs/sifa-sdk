---
'@singi-labs/sifa-sdk': patch
---

People search: `SearchFilters` gains `role` (any position title, current roles first) and `hideFollowing` (leave out people the signed-in viewer follows on Sifa). Results carry optional `matchReasons` (`SearchMatchReason`): the matched skill, role, country, text field or Sifa connection path.
