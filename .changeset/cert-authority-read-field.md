---
'@singi-labs/sifa-sdk': patch
---

Add `authority` as the canonical issuing-organization field on the `ProfileCertification` view type (#249). The write contract already names this field `authority` everywhere; the read view now surfaces it too. The legacy `issuingOrg` alias stays assignable but is now optional and deprecated, and will be removed once consumers read `authority`.
