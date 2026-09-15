---
'@singi-labs/sifa-sdk': patch
---

Refresh `src/jsonld/term-mappings.json` from sifa-lexicons.

The lexicons gained `doi` and `type` on `id.sifa.profile.publication`
(sifa-lexicons#101), so `doi` is now a real lexicon field rather than an
AppView-only one, and `type` maps to `dcterms:type` / `schema:additionalType`
as a `closeMatch`. The committed copy had not been re-synced, which is what the
nightly "Term mappings drift" job has been reporting.
