---
'@singi-labs/sifa-sdk': patch
---

Add roadmap vote read endpoints to `@singi-labs/sifa-sdk/query`:

- **`fetchRoadmapVotes` / `useRoadmapVotes`** -- public roadmap vote tallies keyed by item. Returns `{}` on any error.
- **`fetchMyRoadmapVotes` / `useMyRoadmapVotes`** -- list of roadmap items the authenticated viewer has voted on. Returns `[]` on any error or when the response payload's `voted` field is missing. Supports `cookieHeader` for Next.js RSC server-side calls.

Plus supporting result types (`RoadmapVoter`, `RoadmapVotesResponse`, `FetchMyRoadmapVotesOptions`) and query-key entries (`sifaQueryKeys.roadmap.*`: `all`, `votes`, `myVotes`).

These mirror the read endpoints in `sifa-web/src/lib/roadmap-votes-api.ts`. Behavior preserved including the safe-default error contracts and the `data.voted` extraction guard.

Completes the Phase 5A.2b read-endpoint sweep. Roadmap vote mutations (`castRoadmapVote`, `retractRoadmapVote`) land in 5A.3 alongside the other mutations.
