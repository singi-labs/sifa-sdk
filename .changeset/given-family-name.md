---
'@singi-labs/sifa-sdk': patch
---

Add optional `givenName` and `familyName` to `ProfileSelfRecordSchema` and the
`Profile` interface, matching the additive `id.sifa.profile.self` lexicon
change in `sifa-lexicons@0.6.2`. Adds a `formatStructuredName(givenName,
familyName)` helper that returns `${given} ${family}` (Schema.org Person
order), one of the two if only one is present, or `undefined` so callers can
fall back to `displayName`.
