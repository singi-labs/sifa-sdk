---
'@singi-labs/sifa-sdk': patch
---

Internal: release workflow now authenticates the changesets action with a fine-grained PAT (`CHANGESETS_TOKEN`) instead of the default `GITHUB_TOKEN`. This is purely infrastructure: bot-authored "Version Packages" PRs can now trigger the required `check` CI without needing a manual close/reopen. No public API change.
