---
"@singi-labs/sifa-sdk": patch
---

Added optional `orgRequest` field to `ProfilePosition`, typed as `PositionOrgRequest`, exposing the profile owner's pending or declined position confirmation request, with `decidedAt` and `canRequestAgainAt` dates.
