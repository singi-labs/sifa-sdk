---
'@singi-labs/sifa-sdk': patch
---

Add a `/jsonld` subpath: Schema.org JSON-LD emitters plus the lexicon-to-RDF term reconciliation that backs them.

`buildPersonJsonLd`, `buildProfilePageJsonLd` and `buildBreadcrumbListJsonLd` are ported from sifa-web so sifa.id and page.sifa.id can emit one graph instead of two divergent hand-written ones. A `baseUrl` option supports a non-sifa.id canonical host.

`buildPresentationJsonLd`, `buildPublicationJsonLd`, `buildCourseJsonLd` and `buildProjectJsonLd` are new. These collections previously emitted no structured data at all; a talk page emitted a four-property `CreativeWork` that dropped the event, date, role, location, co-speakers and slide or recording links.

Two rules are enforced in the emitters rather than left to callers: owner-hidden items never reach structured data, and a person named on somebody else's record is emitted only when the naming is confirmed.

`TERM_MAPPINGS` records which `id.sifa.*` terms correspond to terms in BIBO, schema.org, DCMI Terms, FOAF and W3C ORG, with SKOS match strengths and an explicit list of records Sifa deliberately does not map.
