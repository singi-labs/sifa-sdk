---
'@singi-labs/sifa-sdk': patch
---

`buildPersonJsonLd` and `buildProfilePageJsonLd` accept a `canonicalUrl` option, and every Person now carries `alternateName`.

`canonicalUrl` overrides the default `${baseUrl}/p/${handle}` for `url` and `@id`. Personal sites can be served from an arbitrary host, including a self-hosted custom domain, where that default path is not where the page lives. The own-company `@id` still points at the Sifa `/c/` origin, since that page lives on Sifa either way.

`alternateName` emits the handle prefixed with `@`. The handle is how an account is identified across AT Protocol, so it belongs in the graph; sifa-page-renderer already emitted it and sifa.id did not.
