---
'@singi-labs/sifa-sdk': patch
---

Add `normalizeLegalForm`, a pure normalizer that corrects the letter-case of a legal-form designator (GmbH, LLC, N.V., B.V., S.A., ...) at the leading or trailing whole-word token of a company name. It preserves the input's dot and spacing style, touches only the designator token (never the company name), is scoped to ASCII-Latin per decision D8, and is idempotent.
