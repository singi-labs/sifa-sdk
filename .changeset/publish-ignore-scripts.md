---
'@singi-labs/sifa-sdk': patch
---

Fix `Release` workflow: `npm publish` was running the package `prepare` script (which invokes `husky`) inside a lifecycle env where the pnpm-installed husky binary wasn't on PATH, breaking every publish. Pass `--ignore-scripts` to `npm publish` since the dist is already built by the workflow.
