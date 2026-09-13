---
'@singi-labs/sifa-sdk': patch
---

Reconcile the org-profile write schemas with sifa-api.

- `OrgProfileUpdateRequestSchema` (the body sent by `updateOrgProfile` / `useUpdateOrgProfile`) now carries `addresses`, `companySize`, and `links`, so it matches sifa-api's `profileBodySchema` again. These fields have been accepted by the write endpoint since the org-page buildout, but the request schema had not been updated, forcing callers to bypass the typed contract.
- `OrgProfileWriteSchema` field caps now mirror the sifa-api `orgAddressSchema` / `orgLinkSchema` exactly (country 255, postalCode 64, region/locality 255, street 2048, address name 255, companySize 64, link name 255) and the link url is restricted to http(s). Previously some caps were stricter than the endpoint and rejected values it accepts. The array caps intentionally stay at 10 (the owner-editor limit) even though the endpoint tolerates 20.
