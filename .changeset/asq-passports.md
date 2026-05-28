---
'@singi-labs/sifa-sdk': patch
---

Add URL patterns and collection-prefix mappings for two more atproto apps:

- **ASQ** (`fyi.asq.*`): questions URL `https://asq.fyi/q/{did}/{rkey}`,
  profile fallback `https://asq.fyi`.
- **Passports** (`social.passports.*`): profile fallback only,
  `https://passports.social/profile/{handle}`.

Both apps already have cards in sifa-web. Without these entries in the SDK
registry, `resolveCardUrl` returns `null` for them — which would cause the
upcoming sifa-api scanner (singi-labs/sifa-workspace#196 PR 3) to silently
skip 5-10% of activity-card URLs.

Additive — no existing consumers change.
