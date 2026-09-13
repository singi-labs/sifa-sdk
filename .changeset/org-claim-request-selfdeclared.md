---
'@singi-labs/sifa-sdk': patch
---

Add `addresses`, `companySize`, `links`, `industries`, `founded`, and `aliases` to `OrgClaimRequestSchema`, so the claim wizard can seed a company's PDS record from firmographics at claim time. sifa-api's `claimBodySchema` already accepts these; this restores the "mirrors it exactly" contract (the claim schema was the last org schema not yet extended). Link urls are http(s)-only and `founded` is shape-validated (year / YYYY-MM / YYYY-MM-DD).
