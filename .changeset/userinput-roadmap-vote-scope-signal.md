---
'@singi-labs/sifa-sdk': minor
---

feat(query): surface scope-upgrade signal from `castRoadmapVote`

Roadmap votes are now backed by `app.userinput.upvote` records written to the
voter's PDS. `castRoadmapVote` (and `useCastRoadmapVote`) now return a
discriminated-union result — `{ ok: true; data } | { ok: false; error }` —
mirroring `createReaction`, so a first-time voter whose grant lacks the
`app.userinput.upvote` collection surfaces as `scope_insufficient` with a
`requiredScope`, letting the caller trigger an OAuth scope upgrade instead of
showing an error. New exported types: `RoadmapVoteResult`, `RoadmapVoteError`, `CastRoadmapVoteResult`.

Note: this changes the `castRoadmapVote` / `useCastRoadmapVote` return shape —
check `result.ok` instead of `result.success`. `retractRoadmapVote` is
unchanged. Pre-1.0, a breaking change ships as a `minor` bump (0.x has no
major-for-breaking), which is why this is `minor` and not `major`.
