---
'@singi-labs/sifa-sdk': patch
---

Org profile schemas now share the `id.sifa.org.profile` lexicon limits: `name` (200 graphemes), `description` (5,000) and each alias (200; up to 2,000 UTF-16 units). `OrgProfileWriteSchema`, `OrgProfileUpdateRequestSchema` and `OrgClaimRequestSchema` all apply them. The new `orgFoundedSchema` export (a year, a month or a real date) is used by both request schemas, which also reject empty aliases.
