---
'@singi-labs/sifa-sdk': patch
---

Add company search: `fetchSearchCompanies`, `useSearchCompanies`, and the
`CompanySearchResult` / `CompanySearchFilters` / `CompanySearchResponse` types.

A category of its own rather than part of profile search, because the two rank
differently and carry different filters, and a blended results page should
render each section as it resolves instead of waiting for the slowest.
