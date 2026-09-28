---
'@singi-labs/sifa-sdk': patch
---

Export `companyPageRichness`, `COMPANY_PAGE_MIN_DESCRIPTION_LENGTH`, `COMPANY_PAGE_ROSTER_MIN_MEMBERS` and the `CompanyHqFacts` type from the main entry, next to `isCompanyPageIndexable`. `CompanyFirmographics.hq` is now typed as `CompanyHqFacts`, so an interface-typed HQ view (such as sifa-web's) is assignable.
