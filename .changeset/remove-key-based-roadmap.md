---
'@singi-labs/sifa-sdk': minor
---

Remove the key-based roadmap API that the board-backed roadmap replaced: `ROADMAP_ITEM_META` and `RoadmapItemMeta`, `fetchRoadmapVotes`, `fetchMyRoadmapVotes`, `castRoadmapVote`, `retractRoadmapVote`, `RoadmapVotesResponse`, `FetchMyRoadmapVotesOptions`, the `useRoadmapVotes` / `useMyRoadmapVotes` / `useCastRoadmapVote` / `useRetractRoadmapVote` hooks and the `roadmap.votes` / `roadmap.myVotes` query keys. sifa-api no longer serves `/api/roadmap/votes`. Use `fetchRoadmap`, `castRoadmapItemVote` and `retractRoadmapItemVote` with their hooks. `ROADMAP_ISSUES_REPO` and `roadmapIssueUrl` stay.
