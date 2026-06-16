---
'@singi-labs/sifa-sdk': patch
---

resolveCardUrl: link Tangled repos to their exact page when the record has no `name` field. Newer Tangled repos store the slug as the record rkey and omit `name`; for `sh.tangled.repo` the rkey is now used as the slug fallback, so the card links to `tangled.sh/{handle}/{slug}` instead of the profile page.
