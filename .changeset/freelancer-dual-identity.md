---
'@singi-labs/sifa-sdk': patch
---

Support the freelancer dual identity: one account with both a person facet and a company facet.

Adds `personalProfileVisible` to the org profile record schema, the org profile write schema, and `OrgFloorVerdict`, plus two pure predicates in `logic/org-floor`:

- `hasPersonalProfileContent(profile)` -- does this account have a CV worth keeping? Decides the claim-flow default.
- `rendersPersonalProfile(org)` -- should `/p/` render instead of redirecting to `/c/`?

Absent or false keeps today's exclusive behaviour, so nothing changes for existing accounts.
