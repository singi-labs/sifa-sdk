---
'@singi-labs/sifa-sdk': patch
---

Fix the investment fetchers, which pointed at `/api/profile/investment` — an endpoint sifa-api does not have. They now delegate to the generic record route (`/api/profile/records/id.sifa.profile.investment`), like every other collection without a bespoke handler. Adds `PROFILE_INVESTMENT_NSID`.
