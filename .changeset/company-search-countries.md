---
'@singi-labs/sifa-sdk': patch
---

`fetchSearchCompanies` accepts several countries (`country: string | string[]`, sent as repeated params). Add `fetchSearchCompanyFilters`, which reads the organization country counts from `/api/search/companies/filters`.
