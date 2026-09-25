---
"@singi-labs/sifa-sdk": patch
---

Widen `FirmographicInput` / `buildFirmographicState`: `enrichmentText` is now optional and `country`, `links`, and `industry` can be passed, so Jev can classify orgs that have identity signal (name, domain, country, links) but no description. Empty arrays and blank fields are dropped from the state.
