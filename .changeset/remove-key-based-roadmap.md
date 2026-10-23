---
'@singi-labs/sifa-sdk': minor
---

Remove the key-based roadmap API that the board-backed roadmap replaced: `ROADMAP_ITEM_META` and `RoadmapItemMeta`, `fetchRoadmapVotes`, `fetchMyRoadmapVotes`, `castRoadmapVote`, `retractRoadmapVote`, `RoadmapVotesResponse`, `FetchMyRoadmapVotesOptions`, the `useRoadmapVotes` / `useMyRoadmapVotes` / `useCastRoadmapVote` / `useRetractRoadmapVote` hooks and the `sifaQueryKeys.roadmap` keys. These used sifa-api's key-based `/api/roadmap/votes` routes, which are being retired. The item vote hooks no longer invalidate a query cache, since roadmap data is not cached there. Use `fetchRoadmap`, `castRoadmapItemVote` and `retractRoadmapItemVote` with their hooks. `ROADMAP_ISSUES_REPO` and `roadmapIssueUrl` stay.
