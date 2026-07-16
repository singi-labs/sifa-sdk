---
'@singi-labs/sifa-sdk': patch
---

Correct `ProfileView` field types to match the AppView output: `preferredWorkplace` is `string[]` (not `string`), `availableFromUtc`/`availableToUtc` are `number` (not `string`), and `pdsProvider` is a `PdsProviderInfo` object (not `string`).
