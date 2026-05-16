---
'@singi-labs/sifa-sdk': patch
---

Add `completenessScore` / `completenessPercent` / `COMPLETENESS_MAX_SCORE` + the `ProfileCompletion` type to the root barrel (Phase 6.2 -- business logic predicates).

### Why

`profile-completeness.ts` previously lived in `sifa-web/src/lib/` with a comment noting it was "mirrored in sifa-api". Audit showed sifa-api builds the underlying `ProfileCompletion` shape inline (in SQL for admin-stats queries, in route handlers elsewhere) but didn't have a duplicate scoring function. Moving the function to the SDK establishes a canonical source of truth that both clients can consume going forward.

### What's exported

```ts
import {
  COMPLETENESS_MAX_SCORE,
  completenessScore,
  completenessPercent,
  type ProfileCompletion,
} from '@singi-labs/sifa-sdk';
```

- `COMPLETENESS_MAX_SCORE` -- the total signal count (`6`)
- `completenessScore(c: ProfileCompletion): number` -- integer 0..6
- `completenessPercent(c: ProfileCompletion): number` -- rounded 0..100 (discrete: `{0, 17, 33, 50, 67, 83, 100}`)
- `ProfileCompletion` -- shape: `{ hasHeadline, hasAbout, positionCount, educationCount, skillCount, certificationCount }`

### Layout

New `src/logic/` subdirectory in the SDK; exported via the root barrel (no separate subpath -- only ~50 LOC, doesn't justify a subpath split). Follow-up phase 6.2 PRs will adopt this in sifa-web (delete local copy) and optionally in sifa-api (import the interface type for shape consistency).

### Versioning

Patch bump -- purely additive.
