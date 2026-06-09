---
'@singi-labs/sifa-sdk': patch
---

Encode handle/DID path identifiers idempotently in the actor-scoped fetchers
(`fetchProfile`, activity, follow, follow-extras, external-accounts,
endorsement, discovery, stream, admin feature allowlists).

A new `encodeIdentifier` helper decodes before encoding so an identifier that
is already percent-encoded is not encoded twice. Next.js hands route params to
RSC pages percent-encoded on a hard navigation (`did%3Aplc%3A...`) but decoded
on client-side navigation, so the previous bare `encodeURIComponent` turned the
former into `did%253Aplc%253A...`. The AppView then read that as a literal
handle and returned 404, which broke DID-based profile links on direct visits
while they worked when clicked within the app.
