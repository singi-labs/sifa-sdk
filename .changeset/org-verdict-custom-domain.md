---
'@singi-labs/sifa-sdk': patch
---

Add optional `customDomain` to `OrgFloorVerdict`: whether the account's handle
is a custom registrable apex domain, i.e. eligible to claim an org page. Lets
the claim flow gate on eligibility up front instead of after the write.
