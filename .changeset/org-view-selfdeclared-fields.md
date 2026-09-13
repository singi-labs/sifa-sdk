---
'@singi-labs/sifa-sdk': patch
---

Add the self-declared `industries`, `founded`, and `aliases` fields to the `OrgProfileView` response type (and a new `OrgIndustryView`), so consumers can render them. The write/record/update-request schemas already carry these fields; the view type (the shape of the org profile on the profile resolve) had been missed, which left it out of sync with sifa-api's `OrgProfileView`.
