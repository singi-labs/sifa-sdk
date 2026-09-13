---
'@singi-labs/sifa-sdk': patch
---

Reconcile the org-profile schemas with sifa-api and add the self-declared company narrative fields.

- `OrgProfileUpdateRequestSchema` (the body sent by `updateOrgProfile` / `useUpdateOrgProfile`) now carries `addresses`, `companySize`, and `links`, matching sifa-api's `profileBodySchema`. These were accepted by the endpoint since the org-page buildout but missing from the request schema, forcing callers to bypass the typed contract.
- `OrgProfileWriteSchema` field caps now mirror the sifa-api `orgAddressSchema` / `orgLinkSchema` exactly (country 255, postalCode 64, region/locality 255, street 2048, address name 255, companySize 64, link name 255) and the link url is restricted to http(s). Array caps intentionally stay at 10 (the owner-editor limit) even though the endpoint tolerates 20.
- `OrgProfileRecordSchema`, `OrgProfileWriteSchema`, and `OrgProfileUpdateRequestSchema` all gain the self-declared `industries` (array of industry/domain pairs, same shape as the person profile), `founded` (year / YYYY-MM / YYYY-MM-DD), and `aliases` ("also known as" names). Registry-sourced facts (LEI, registration number, legal form, ticker, status) are not self-declared and stay out of these schemas.
