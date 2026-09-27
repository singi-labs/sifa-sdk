---
'@singi-labs/sifa-sdk': patch
---

The ESM build now emits one file per source module instead of one bundled file per entry point. Bundlers can now drop the modules a consumer does not import, so importing a formatter or taxonomy from the main entry no longer pulls in every zod schema. The public API, the subpath exports and the CJS build are unchanged.
