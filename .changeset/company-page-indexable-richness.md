---
'@singi-labs/sifa-sdk': patch
---

`isCompanyPageIndexable` now applies the organization-page richness line: a page is indexable when it is claimed, when it has at least 5 Sifa members, or when it has at least 5 real facts (a description of 40+ characters, logo, headcount, founded, location, external link, non-inferred industry; one Sifa member adds a bonus point). A Jev-inferred industry (`industrySource: 'jev'`) no longer counts. Adds `companyPageRichness`, `COMPANY_PAGE_MIN_DESCRIPTION_LENGTH` and `COMPANY_PAGE_ROSTER_MIN_MEMBERS`, and the optional `industrySource`, `country`, `hq`, `externalLinks`, `memberCount` and `claimed` inputs.
