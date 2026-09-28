---
'@singi-labs/sifa-sdk': patch
---

Declare the optional `verificationBadges: AccountVerification[]` field on `Profile`, `SuggestionProfile`, `ProfileSearchResult` and `FollowProfile`, matching what the API already returns. `FollowProfileSchema` now parses and keeps the field, dropping badges from providers this version does not recognize instead of rejecting the row.
