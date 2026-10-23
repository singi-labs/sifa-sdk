---
'@singi-labs/sifa-sdk': patch
---

Add `fetchRoadmap`, `castRoadmapItemVote`, `retractRoadmapItemVote`, the `useCastRoadmapItemVote` / `useRetractRoadmapItemVote` hooks and `splitRoadmapBody` for the roadmap read from Sifa's userinput.app board (`GET /api/roadmap`, votes per `{ did, rkey }`). The key-based roadmap vote functions are unchanged.
