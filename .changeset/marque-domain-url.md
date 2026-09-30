---
'@singi-labs/sifa-sdk': patch
---

Give a marque domain registration ("Registered atmoco.at") a link: `toStreamCardVM` now sets `sourceUrl` to `https://<domain>` for `at.marque.domain`, so the card and its content resolve to the registered site instead of rendering unlinked. Non-domain values are left unlinked.
