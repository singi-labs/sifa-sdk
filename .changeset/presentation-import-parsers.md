---
'@singi-labs/sifa-sdk': patch
---

Export `formatPresentationDuration` from the package root (it was built but missing from the barrel), and add CSV import parsers for the Talks & sessions feature: `parsePresentationDuration`, `durationFromMinutes`, `parseIntendedAudiences`, `stripHtmlToText`, `normalizePresentationRole`, `normalizePresentationMode`, and the row mappers `presentationCsvRowToRecord` / `presentationDeliveryCsvRowToRecord`.
