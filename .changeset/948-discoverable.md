---
'@singi-labs/sifa-sdk': patch
---

Add optional `discoverable` field to `ProfileSelfRecordSchema` and the `Profile` type. Mirrors `id.sifa.profile.self.discoverable` (sifa-lexicons 0.6.1). Absence is treated as default-true. Consumers gate noindex / sitemap exclusion on `discoverable === false`.
