---
"@singi-labs/sifa-sdk": patch
---

Add optional `companyDomain` and `companyPublicId` to the `ProfilePosition` view type. The AppView resolves these for a durably-linked position so consumers can link a company name to its `/c/{domain}` page without re-resolving `entityRef`.
