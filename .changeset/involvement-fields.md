---
'@singi-labs/sifa-sdk': patch
---

Add `entityRef`, `location`, and `skills` to `id.sifa.profile.involvement` (matching `position`). The write schema validates an http(s) `entityRef`, an optional `location`, and up to 50 skill refs; the `ProfileInvolvement` read type gains `entityRef`, the AppView-resolved `entityName`, `location`, `skills`, and `linkedSkills`.
