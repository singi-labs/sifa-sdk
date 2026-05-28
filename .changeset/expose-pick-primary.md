---
'@singi-labs/sifa-sdk': patch
---

Re-export `pickPrimaryPosition` (and its `PrimaryPositionCandidate` type) from the package's main entry. The helper landed in 0.9.8/0.9.9 but only via `./logic/index.js` — the explicit allowlist in `src/index.ts` didn't include it, so consumers couldn't import it from `@singi-labs/sifa-sdk`.
