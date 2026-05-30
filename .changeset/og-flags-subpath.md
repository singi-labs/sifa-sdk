---
'@singi-labs/sifa-sdk': patch
---

add @singi-labs/sifa-sdk/flags subpath with self-hosted twemoji country flags

New optional subpath `@singi-labs/sifa-sdk/flags` exports `getFlagSvg(cc)` and
`listSupportedCountryCodes()`. Ships 258 minified Twemoji regional-indicator
SVGs (CC-BY 4.0, see `NOTICE`) so sifa-web's OG image renderer and the planned
sifa-app can share flag assets without a CDN dependency at render time. Codes
are ISO-3166 alpha-2 and lookups are case-insensitive. Refs the OG image spine
redesign plan.
