---
'@singi-labs/sifa-sdk': patch
---

Fix roadmap vote casting: `castRoadmapVote` sent a `Content-Type: application/json` header with no request body, which the API rejected with a 400 before recording the vote. The bodyless POST no longer declares a JSON content-type.
