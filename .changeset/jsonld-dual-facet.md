---
'@singi-labs/sifa-sdk': patch
---

`buildPersonJsonLd` now emits a stable `@id` and links dual-facet accounts to their own company.

Ports sifa-web #327, which landed after the `/jsonld` module was written and would otherwise have regressed when sifa-web adopted the SDK. The Person carries `@id` derived from `baseUrl`, so a `/c/` Organization's `founder` can point back at it. An account that opted into showing both a personal and a company face gets that company first in `worksFor` with a resolvable `@id`; without it a crawler reads the two pages as unrelated entities that happen to share a domain.
