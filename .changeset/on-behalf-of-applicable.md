---
'@singi-labs/sifa-sdk': patch
---

Add `ON_BEHALF_OF_EMPLOYMENT_TYPES` and `isOnBehalfOfApplicable()` to the employment-type taxonomy. Editors use it to offer the `onBehalfOf` disclosure only for board and advisory roles, where being someone's representative is meaningful. Derived from the `Governance & advisory` group so it cannot drift from the dropdown.
