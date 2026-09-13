---
'@singi-labs/sifa-sdk': patch
---

Add `addresses`, `companySize`, and `links` to `OrgProfileUpdateRequestSchema`, so the org-profile update body the fetcher and `useUpdateOrgProfile` hook send matches sifa-api's `profileBodySchema` again. These fields have been accepted by the write endpoint since the org-page buildout, but the request schema had not been updated, forcing callers to bypass the typed contract.
