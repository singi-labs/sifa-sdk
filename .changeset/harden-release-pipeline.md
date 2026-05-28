---
'@singi-labs/sifa-sdk': patch
---

Internal: harden CI release pipeline. All GitHub Actions pinned to commit SHAs, `--ignore-scripts` on every install, and the release workflow split into separate `build` and `publish` jobs so the OIDC-bearing publish job no longer installs project dependencies. No runtime or API changes.
