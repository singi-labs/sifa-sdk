---
'@singi-labs/sifa-sdk': patch
---

Make `company` optional on `ProfilePositionRecordSchema` and add an `isCompanyRequired(employmentType)` predicate plus the `COMPANY_OPTIONAL_EMPLOYMENT_TYPES` set. Company is optional for the Independent employment-type group (contract, freelance, self-employed, independent work) and required otherwise — including when the type is unspecified. Mirrors sifa-lexicons making `company` optional on `id.sifa.profile.position`.
