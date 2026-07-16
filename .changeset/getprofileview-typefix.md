---
'@singi-labs/sifa-sdk': patch
---

Correct `ProfileView` field types to match the AppView output: `preferredWorkplace` is `string[]` (not `string`), and `availableFromUtc`/`availableToUtc` are `number` (not `string`).
