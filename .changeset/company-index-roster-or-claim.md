---
'@singi-labs/sifa-sdk': minor
---

- `isCompanyPageIndexable` now returns `true` only when the page is claimed or `memberCount` is at least `COMPANY_PAGE_ROSTER_MIN_MEMBERS` (5), and `canonicalName` is non-empty.
- Removed the firmographic richness path: `companyPageRichness`, `COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS`, `COMPANY_PAGE_MIN_DESCRIPTION_LENGTH`, and `CompanyHqFacts`.
- Renamed `CompanyFirmographics` to `CompanyPageIndexFacts` with fields `canonicalName`, `memberCount`, and `claimed`.
- Breaking change for callers of the removed exports.
